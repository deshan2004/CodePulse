# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
import subprocess
import os
import shutil
import requests 
import google.generativeai as genai
import tempfile
from dotenv import load_dotenv

load_dotenv()

# CORS සහ Database imports
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from database import get_db, engine
import models
import schemas

# Database tables create කිරීම
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodePulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔐 Configurations
SONAR_HOST_URL = os.getenv("SONAR_HOST_URL", "http://localhost:9000")
SONAR_TOKEN = os.getenv("SONAR_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SONAR_SCANNER_PATH = os.getenv("SONAR_SCANNER_PATH", "sonar-scanner")
JAVA_HOME_PATH = os.getenv("JAVA_HOME_PATH")

# Gemini configure කිරීම
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# --- PROJECTS ENDPOINTS ---

@app.post("/projects", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/projects", response_model=List[schemas.ProjectResponse])
def get_all_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()


# --- REAL DYNAMIC SCAN TRIGGER ENDPOINT ---

@app.post("/projects/{project_id}/scan", response_model=schemas.ScanReportResponse, status_code=status.HTTP_201_CREATED)
def trigger_project_scan(project_id: UUID, db: Session = Depends(get_db)):
    # 1. Project එක පරීක්ෂා කිරීම
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if not project.github_url:
        raise HTTPException(status_code=400, detail="This project does not have a GitHub URL to scan")
        
    project_key = f"project_{project.id}"
    project_name = project.project_name.replace(" ", "_")
    
    # කෝඩ් එක තාවකාලිකව ඩවුන්ලෝඩ් කරන ෆෝල්ඩර් එක
    temp_dir = tempfile.mkdtemp(prefix=f"temp_scans_{project_id}_")
    clone_dir = os.path.join(temp_dir, "repo")

    try:
        # 2. GitHub එකෙන් කෝඩ් එක බාගැනීම (Git Clone)
        print(f"Cloning repository from: {project.github_url}...")
        subprocess.run(["git", "clone", project.github_url, clone_dir], check=True)

        # 3. ඔයාගේ Windows Environment සෙටප් එක
        my_env = os.environ.copy()
        if JAVA_HOME_PATH:
            my_env["JAVA_HOME"] = JAVA_HOME_PATH
            my_env["PATH"] = rf"{JAVA_HOME_PATH}\bin;" + my_env.get("PATH", "")
        
        # 4. Scanner Command එක
        command = [
            SONAR_SCANNER_PATH,
            f"-Dsonar.projectKey={project_key}",
            f"-Dsonar.projectName={project_name}",
            f"-Dsonar.sources={clone_dir}",
            f"-Dsonar.host.url={SONAR_HOST_URL}",
            f"-Dsonar.token={SONAR_TOKEN}",
            f"-Dsonar.exclusions=**/node_modules/**,**/venv/**,**/.next/**"
        ]
        
        # 5. ස්කෑන් එක ක්‍රියාත්මක කිරීම
        print(f"Running Sonar Scanner for {project_name}...")
        subprocess.run(command, check=True, env=my_env)
        
    except subprocess.CalledProcessError as e:
        print(f"Sonar Scanner failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sonar Scanner execution failed: {str(e)}")

    # 6. SonarQube API වෙතින් සැබෑ දත්ත ලබා ගැනීම
    api_url = f"{SONAR_HOST_URL}/api/measures/component"
    params = {
        "component": project_key,
        "metricKeys": "duplicated_lines_density,vulnerabilities,coverage,lines"
    }
    
    # Default values (API එක වැඩ නොකරොත් බේරෙන්න)
    code_duplication, vulnerabilities, test_coverage, lines_of_code = 0.0, 0, 0.0, 0

    try:
        response = requests.get(api_url, params=params, auth=(SONAR_TOKEN, ""))
        if response.status_code == 200:
            res_data = response.json()
            measures = res_data.get("component", {}).get("measures", [])
            for measure in measures:
                metric = measure["metric"]
                val = float(measure["value"])
                if metric == "duplicated_lines_density": code_duplication = val
                elif metric == "vulnerabilities": vulnerabilities = int(val)
                elif metric == "coverage": test_coverage = val
                elif metric == "lines": lines_of_code = int(val)
    except Exception as e:
        print(f"API Error fetching metrics: {e}")

    # 7. Database එකට වාර්තාව ඇතුළත් කිරීම
    db_report = models.ScanReport(project_id=project_id, status="Completed", completed_at=datetime.utcnow())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    db_metrics = models.QualityMetric(
        report_id=db_report.id,
        code_duplication_percentage=code_duplication,
        security_vulnerabilities_count=vulnerabilities,
        test_coverage_percentage=test_coverage,
        total_lines_of_code=lines_of_code
    )
    db.add(db_metrics)
    db.commit()

    # 8. Clean up: වැඩේ ඉවර නිසා ලෝකල් එකේ තියෙන temp ෆෝල්ඩර් එක මකා දැමීම
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)

    return db_report


# --- DASHBOARD INSIGHTS ENDPOINT ---

@app.get("/projects/{project_id}/dashboard")
def get_project_dashboard_metrics(project_id: UUID, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    latest_report = db.query(models.ScanReport)\
                      .filter(models.ScanReport.project_id == project_id, models.ScanReport.status == "Completed")\
                      .order_by(models.ScanReport.triggered_at.desc())\
                      .first()
                      
    if not latest_report:
        return {
            "project_name": project.project_name,
            "programming_language": project.programming_language,
            "status": "No scans performed yet",
            "code_duplication_percentage": 0.0,
            "security_vulnerabilities_count": 0,
            "test_coverage_percentage": 0.0,
            "total_lines_of_code": 0,
            "performance_endpoints": []
        }
        
    quality = db.query(models.QualityMetric).filter(models.QualityMetric.report_id == latest_report.id).first()
    performance = db.query(models.PerformanceMetric).filter(models.PerformanceMetric.report_id == latest_report.id).all()
    
    return {
        "project_name": project.project_name,
        "programming_language": project.programming_language,
        "status": latest_report.status,
        "code_duplication_percentage": quality.code_duplication_percentage if quality else 0.0,
        "security_vulnerabilities_count": quality.security_vulnerabilities_count if quality else 0,
        "test_coverage_percentage": quality.test_coverage_percentage if quality else 0.0,
        "total_lines_of_code": quality.total_lines_of_code if quality else 0,
        "performance_endpoints": [
            {"endpoint": p.endpoint_url, "avg_response_time": p.avg_response_time_ms, "error_rate": p.error_rate_percentage, "throughput": p.throughput}
            for p in performance
        ]
    }


# --- 🤖 GEMINI AI ADVICE ENDPOINT ---

@app.get("/projects/{project_id}/ai-advice")
def get_ai_advice_for_project(project_id: UUID, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    latest_report = db.query(models.ScanReport)\
                      .filter(models.ScanReport.project_id == project_id, models.ScanReport.status == "Completed")\
                      .order_by(models.ScanReport.triggered_at.desc())\
                      .first()

    if not latest_report:
        raise HTTPException(status_code=400, detail="Please trigger a scan first before asking for AI advice.")

    quality = db.query(models.QualityMetric).filter(models.QualityMetric.report_id == latest_report.id).first()
    if not quality:
        raise HTTPException(status_code=400, detail="No quality metrics found for the latest scan.")

    # Prompt එක සකසා ගැනීම
    prompt = f"""
    You are an expert Software Quality Assurance (SQA) Engineer. Analyze the following SonarQube metrics and provide structural recommendations, code optimization practices, and bug fixes.

    Project Name: {project.project_name}
    Programming Language: {project.programming_language}
    
    SonarQube Quality Metrics:
    - Test Coverage: {quality.test_coverage_percentage}%
    - Code Duplication: {quality.code_duplication_percentage}%
    - Security Vulnerabilities: {quality.security_vulnerabilities_count}
    - Total Lines of Code: {quality.total_lines_of_code}

    Please provide a professional response in Markdown format. Give specific code block examples tailored to {project.programming_language} to address bugs, code duplication, or test coverage issues.
    """

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return {
            "project_id": str(project_id),
            "ai_recommendation": response.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")