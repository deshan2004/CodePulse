"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// --- TYPES DEFINITIONS ---
interface Project {
  id: string;
  project_name: string;
  programming_language: string;
  github_url: string | null;
}

interface DashboardData {
  project_name: string;
  programming_language: string;
  github_url: string | null;
  status: string;
  code_duplication_percentage: number;
  security_vulnerabilities_count: number;
  test_coverage_percentage: number;
  total_lines_of_code: number;
  performance_endpoints: any[];
}

export default function CodePulseDashboard() {
  // States
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanLoading, setScanLoading] = useState<boolean>(false);
  
  // AI States
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  // 1. මුලින්ම සියලුම ප්‍රොජෙක්ට්ස් ලැයිස්තුව ලබා ගැනීම
  useEffect(() => {
    fetchProjects();
  }, []);

  // 2. ප්‍රොජෙක්ට් එකක් මාරු කරන විට අදාළ දත්ත ලබා ගැනීම
  useEffect(() => {
    if (selectedProjectId) {
      fetchDashboardMetrics(selectedProjectId);
      setAiAdvice(""); // ප්‍රොජෙක්ට් එක මාරු කරද්දී පරණ AI උපදෙස් මකනවා
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id); // මුල්ම ප්‍රොජෙක්ට් එක default සිලෙක්ට් කරනවා
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardMetrics = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}/dashboard`);
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to fetch dashboard metrics", err);
    }
  };

  // 3. Scan එකක් Trigger කිරීම
  const handleTriggerScan = async () => {
    if (!selectedProjectId) return;
    setScanLoading(true);
    try {
      await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/scan`, {
        method: "POST",
      });
      // ස්කෑන් එක ඉවර වුණාම ඩෑෂ්බෝඩ් එක රිෆ්‍රෙෂ් කරනවා
      await fetchDashboardMetrics(selectedProjectId);
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setScanLoading(false);
    }
  };

  // 4. Gemini AI Advice ලබා ගැනීම
  const handleFetchAiAdvice = async () => {
    if (!selectedProjectId) return;
    setAiLoading(true);
    setAiError("");
    setAiAdvice("");
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/ai-advice`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "AI Analysis failed");
      }
      const data = await res.json();
      setAiAdvice(data.ai_recommendation);
    } catch (err: any) {
      setAiError(err.message || "Failed to load AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#060814] text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#060814] text-slate-100 font-sans overflow-hidden">
      
      {/* --- SIDEBAR WORKSPACE --- */}
      <div className="w-64 bg-[#0D1322] border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-slate-800">
            <h1 className="text-lg font-bold tracking-wider text-blue-400 flex items-center gap-2">
              <span>&gt;_</span> CodePulse Workspace
            </h1>
          </div>
          
          <div className="p-4">
            <button className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-2">
              <span>+</span> Add New Project
            </button>
          </div>

          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              My Loaded Projects ({projects.length})
            </p>
            <div className="space-y-1 overflow-y-auto max-h-[calc(h-screen-200px)]">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all group ${
                    selectedProjectId === proj.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📂</span>
                    <div>
                      <h4 className="text-sm font-medium text-slate-200 group-hover:text-white">{proj.project_name}</h4>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300">{proj.programming_language}</p>
                    </div>
                  </div>
                  <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Made with ❤️ by CodePulse
        </div>
      </div>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#060814]">
        
        {dashboardData ? (
          <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
            
            {/* TOP HEADER ROW */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-extrabold tracking-tight text-white">{dashboardData.project_name}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-900/50 text-blue-400 rounded-full border border-blue-800/60">
                    {dashboardData.programming_language}
                  </span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    dashboardData.status === "Completed" 
                      ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/60" 
                      : "bg-amber-950/50 text-amber-400 border-amber-800/60"
                  }`}>
                    • {dashboardData.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">Automated Software Quality Assurance (SQA) Dashboard</p>
                {dashboardData.github_url && (
                  <a href={dashboardData.github_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">
                    🔗 View Repository: {dashboardData.github_url}
                  </a>
                )}
              </div>

              <button
                onClick={handleTriggerScan}
                disabled={scanLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-600/15 flex items-center gap-2"
              >
                {scanLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <>🔄 Trigger New Scan</>
                )}
              </button>
            </div>

            {/* --- 4x4 METRICS CARDS GRID --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* CARD 1: TEST COVERAGE */}
              <div className="p-5 bg-[#0D1322] border border-slate-800 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-slate-400">Test Coverage</span>
                  <span className="text-emerald-400 text-xl">✅</span>
                </div>
                <h3 className="text-4xl font-black text-white mb-3">{dashboardData.test_coverage_percentage}%</h3>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${dashboardData.test_coverage_percentage}%` }}></div>
                </div>
              </div>

              {/* CARD 2: VULNERABILITIES */}
              <div className="p-5 bg-[#0D1322] border border-slate-800 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-slate-400">Vulnerabilities</span>
                  <span className="text-blue-400 text-xl">🛡️</span>
                </div>
                <h3 className="text-4xl font-black text-white mb-2">{dashboardData.security_vulnerabilities_count}</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span>✔</span> Codebase is secure
                </p>
              </div>

              {/* CARD 3: CODE DUPLICATION */}
              <div className="p-5 bg-[#0D1322] border border-slate-800 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-slate-400">Code Duplication</span>
                  <span className="text-amber-400 text-xl">🥞</span>
                </div>
                <h3 className="text-4xl font-black text-white mb-2">{dashboardData.code_duplication_percentage}%</h3>
                <p className="text-xs text-slate-500">SonarQube threshold benchmark &lt; 10%</p>
              </div>

              {/* CARD 4: LINES OF CODE */}
              <div className="p-5 bg-[#0D1322] border border-slate-800 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-slate-400">Total Lines of Code</span>
                  <span className="text-indigo-400 text-xl">&lt;/&gt;</span>
                </div>
                <h3 className="text-4xl font-black text-white mb-2">
                  {dashboardData.total_lines_of_code.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500">Total executable codebase lines</p>
              </div>

            </div>

            {/* --- CHARTS PLACEHOLDER ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 bg-[#0D1322] border border-slate-800 rounded-2xl min-h-[250px] flex flex-col justify-between">
                <h4 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                  📈 Endpoint Performance (JMeter Mock)
                </h4>
                <div className="flex-1 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl my-4">
                  Chart space: {dashboardData.performance_endpoints.length > 0 ? "Data Loaded" : "No endpoint performance metrics available."}
                </div>
                <p className="text-xs text-center text-slate-500">-- Avg Response Time (ms) --</p>
              </div>

              <div className="p-6 bg-[#0D1322] border border-slate-800 rounded-2xl min-h-[250px] flex flex-col justify-between">
                <h4 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                  📊 Throughput & Error Rate
                </h4>
                <div className="flex-1 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl my-4">
                  Pie / Bar Chart space
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Error %</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Req/Sec</span>
                </div>
              </div>
            </div>

            {/* --- 🤖 GEMINI AI INTEGRATION SECTION --- */}
            <div className="p-6 bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] border border-slate-800 rounded-2xl shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    🤖 AI-Powered SQA Assistant
                  </h3>
                  <p className="text-xs text-slate-400">Get optimized code fixes and recommendations based on your real-time SonarQube metrics.</p>
                </div>
                
                <button
                  onClick={handleFetchAiAdvice}
                  disabled={aiLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Analyzing Codebase...
                    </>
                  ) : (
                    "Analyze with Gemini AI"
                  )}
                </button>
              </div>

              {/* Error Box */}
              {aiError && (
                <div className="p-4 bg-red-950/40 border border-red-800/60 text-red-400 rounded-xl text-xs">
                  ⚠️ {aiError}
                </div>
              )}

              {/* AI Markdown Response Box */}
              {aiAdvice && (
                <div className="mt-4 p-5 bg-slate-950/80 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed overflow-x-auto max-w-none prose prose-invert">
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }) {
                        return (
                          <code className="bg-slate-900 text-orange-400 px-1.5 py-0.5 rounded text-xs font-mono block p-4 my-2 border border-slate-800 overflow-x-auto" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {aiAdvice}
                  </ReactMarkdown>
                </div>
              )}

              {/* Placeholder Box */}
              {!aiAdvice && !aiLoading && !aiError && (
                <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Click the button above to generate smart AI optimization and bug-fixing suggestions.
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            No project selected or no dashboard metrics found.
          </div>
        )}

      </div>
    </div>
  );
}