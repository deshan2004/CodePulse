from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# Frontend එකෙන් ප්‍රොජෙක්ට් එකක් ඇඩ් කරද්දී එවන ඩේටา වැලිඩේට් කරන්න
class ProjectCreate(BaseModel):
    user_id: UUID
    project_name: str
    programming_language: str
    github_url: Optional[str] = None

# ඩේටාබේස් එකෙන් Frontend එකට ප්‍රොජෙක්ට් ඩේටา ආපහු යවද්දී පාවිච්චි කරන ස්ට්‍රක්චර් එක
class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    project_name: str
    programming_language: str
    github_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Scan Report එකක් එලියට යවද්දී දත්ත පෙන්වන ආකාරය
class ScanReportResponse(BaseModel):
    id: UUID
    project_id: UUID
    status: str
    triggered_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Dashboard එකට සේරම මෙට්‍රික්ස් ටික එකපාර යවන්න පාවිච්චි කරන Schema එක
class DashboardMetricsResponse(BaseModel):
    project_name: str
    programming_language: str
    status: str
    code_duplication_percentage: float
    security_vulnerabilities_count: int
    test_coverage_percentage: float
    total_lines_of_code: int