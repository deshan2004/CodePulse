"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from "recharts";
import { 
  ShieldAlert, Activity, Code, Layers, CheckCircle, RefreshCw, Server, 
  Plus, Folder, ChevronRight, Clock, Globe, Terminal 
} from "lucide-react";

interface PerformanceEndpoint {
  endpoint: string;
  avg_response_time: number;
  error_rate: number;
  throughput: number;
}

interface DashboardData {
  project_name: string;
  programming_language: string;
  status: string;
  code_duplication_percentage: number;
  security_vulnerabilities_count: number;
  test_coverage_percentage: number;
  total_lines_of_code: number;
  performance_endpoints: PerformanceEndpoint[];
}

interface ProjectListItem {
  id: string;
  project_name: string;
  programming_language: string;
  github_url: string | null;
}

export default function Dashboard() {
  // States
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);

  // Form States (For creating new projects)
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newLanguage, setNewLanguage] = useState<string>("JavaScript");
  const [newGithubUrl, setNewGithubUrl] = useState<string>("");
  const [creatingProject, setCreatingProject] = useState<boolean>(false);

  // 1. Database එකේ තියෙන ඔක්කොම Projects ලැයිස්තුව ලෝඩ් කරගැනීම
  const fetchAllProjects = async (selectNewestId?: boolean) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/projects");
      if (response.ok) {
        const data: ProjectListItem[] = await response.json();
        setProjects(data);
        
        // ප්‍රොජෙක්ට්ස් තියෙනවා නම් සහ දැනට එකක්වත් සිලෙක්ට් වෙලා නැත්නම් මුල්ම එක සිලෙක්ට් කරනවා
        if (data.length > 0 && !selectedProjectId && !selectNewestId) {
          setSelectedProjectId(data[0].id);
        } else if (selectNewestId && data.length > 0) {
          // අලුතින්ම හැදූ ප්‍රොජෙක්ට් එක සිලෙක්ට් කිරීමට (ලැයිස්තුවේ අන්තිම එක)
          setSelectedProjectId(data[data.length - 1].id);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // 2. සිලෙක්ට් කරපු Project එකට අදාළ Dashboard Metrics ලෝඩ් කරගැනීම
  const fetchDashboardMetrics = async (id: string) => {
    if (!id) return;
    setLoadingMetrics(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/projects/${id}/dashboard`);
      if (response.ok) {
        const result = await response.json();
        setDashboardData(result);
      } else {
        setDashboardData(null);
      }
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      setDashboardData(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // 3. Frontend එකෙන් අලුත් Project එකක් Create කිරීම
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreatingProject(true);
    // User Table එක සඳහා Mock User ID එකක් (models.py එකේ user_id අවශ්‍ය නිසා)
    const mockUserId = "43e503ec-bcd3-45b4-b3c1-dfb0c7efe722";

    try {
      const response = await fetch("http://127.0.0.1:8000/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: mockUserId,
          project_name: newProjectName,
          programming_language: newLanguage,
          github_url: newGithubUrl || null
        })
      });

      if (response.ok) {
        const createdProject = await response.json();
        
        // Form එක clear කිරීම
        setNewProjectName("");
        setNewGithubUrl("");
        setShowAddForm(false);
        
        // Projects List එක refresh කරලා අලුත් එක සිලෙක්ට් කරනවා
        await fetchAllProjects(true);
        setSelectedProjectId(createdProject.id);
        
        // 🚀 අලුත් ප්‍රොජෙක්ට් එකක් හැදූ ගමන්ම Auto එකෙන් Initial Scan එකක් Trigger කරනවා
        await handleTriggerScan(createdProject.id);
      } else {
        alert("Failed to create project. Please check backend logs.");
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setCreatingProject(false);
    }
  };

  // 4. "Trigger New Scan" බටන් එක එබුවහම Mock Scan Engine එක රන් කිරීම
  const handleTriggerScan = async (id: string) => {
    const targetId = id || selectedProjectId;
    if (!targetId) return;

    setScanning(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/projects/${targetId}/scan`, {
        method: "POST"
      });
      if (response.ok) {
        // Scan එක ඉවර වුණ ගමන්ම Dashboard metrics ටික ආයෙත් ලෝඩ් කරනවා
        await fetchDashboardMetrics(targetId);
      } else {
        alert("Scan trigger failed.");
      }
    } catch (error) {
      console.error("Error triggering scan:", error);
    } finally {
      setScanning(false);
    }
  };

  // useEffect: මුලින්ම සේරම ප්‍රොජෙක්ට්ස් ටික ලෝඩ් කරගැනීම
  useEffect(() => {
    fetchAllProjects();
  }, []);

  // useEffect: ප්‍රොජෙක්ට් එක මාරු කරද්දී ඒකට අදාළ දත්ත ලෝඩ් කිරීම
  useEffect(() => {
    if (selectedProjectId) {
      fetchDashboardMetrics(selectedProjectId);
    }
  }, [selectedProjectId]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* ========================================================
          LEFT SIDEBAR: PROJECT NAVIGATION & MANAGEMENT
         ======================================================== */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold tracking-tight text-white">CodePulse Workspace</h2>
          </div>
        </div>

        {/* Create Project Button */}
        <div className="p-4">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-medium transition text-sm shadow-sm"
          >
            <Plus className={`h-4 w-4 transition-transform ${showAddForm ? 'rotate-45' : ''}`} /> 
            {showAddForm ? "Cancel" : "Add New Project"}
          </button>
        </div>

        {/* Add Project Form (Toggleable) */}
        {showAddForm && (
          <form onSubmit={handleCreateProject} className="px-4 pb-4 mb-4 border-b border-slate-800 bg-slate-950/40 p-4 rounded-xl mx-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Project Name *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g., Neth-Sawan App"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Language</label>
              <select 
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="React Native">React Native</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">GitHub URL (Optional)</label>
              <input 
                type="url" 
                placeholder="https://github.com/..."
                value={newGithubUrl}
                onChange={(e) => setNewGithubUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <button 
              type="submit" 
              disabled={creatingProject}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-md text-xs font-semibold transition"
            >
              {creatingProject ? "Saving..." : "Save Project"}
            </button>
          </form>
        )}

        {/* Projects List Selection */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            My Loaded Projects ({projects.length})
          </div>
          {projects.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 italic">No projects found. Add one above!</div>
          ) : (
            projects.map((proj) => {
              const isSelected = proj.id === selectedProjectId;
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition group ${
                    isSelected 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                      : "hover:bg-slate-800/60 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Folder className={`h-4 w-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{proj.project_name}</p>
                      <p className={`text-xs truncate ${isSelected ? "text-blue-200" : "text-slate-500"}`}>{proj.programming_language}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? "text-white" : "text-slate-600 group-hover:translate-x-0.5"}`} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          RIGHT MAIN CONTENT AREA: SQA DASHBOARD VISUALS
         ======================================================== */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        
        {/* Loading overlay for metrics query */}
        {loadingMetrics && !dashboardData ? (
          <div className="flex-1 flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-lg font-medium text-slate-300 tracking-wide">Fetching SQA Metrics from Backend...</p>
            </div>
          </div>
        ) : !dashboardData ? (
          /* Default state when database has absolutely no info or connection failed */
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
            <div className="text-center p-8 border border-slate-800 rounded-2xl bg-slate-900 max-w-md shadow-2xl">
              <p className="text-rose-400 font-bold text-lg mb-2">⚠️ Workspace Setup Required</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Could not stream analytics. Please ensure your FastAPI backend is live at <code className="text-blue-400">port 8000</code> and you have added or selected a project in the sidebar!
              </p>
              <button 
                onClick={() => { fetchAllProjects(); if(selectedProjectId) fetchDashboardMetrics(selectedProjectId); }} 
                className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-lg transition"
              >
                Reconnect Database
              </button>
            </div>
          </div>
        ) : (
          /* Actual active content dashboard grid view */
          <div className="p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8">
            
            {/* Top Dashboard Header Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-6 gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white">{dashboardData.project_name}</h1>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {dashboardData.programming_language}
                  </span>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${
                    dashboardData.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dashboardData.status === "Completed" ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                    {dashboardData.status}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">Automated Software Quality Assurance (SQA) Dashboard</p>
              </div>
              
              <button 
                onClick={() => handleTriggerScan(selectedProjectId)} 
                disabled={scanning || loadingMetrics}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-600/20 text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} /> 
                {scanning ? "Analyzing Codebase..." : "Trigger New Scan"}
              </button>
            </div>

            {/* SQA Quality Metrics KPI Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Test Coverage Card */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-sm hover:border-slate-800 transition">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-slate-400">Test Coverage</span>
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">{dashboardData.test_coverage_percentage}%</div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-emerald-400 h-full transition-all duration-700" style={{ width: `${dashboardData.test_coverage_percentage}%` }}></div>
                </div>
              </div>

              {/* Security Vulnerabilities Card */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-sm hover:border-slate-800 transition">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-slate-400">Vulnerabilities</span>
                  <ShieldAlert className={`h-5 w-5 ${dashboardData.security_vulnerabilities_count > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`} />
                </div>
                <div className="text-3xl font-black text-white">{dashboardData.security_vulnerabilities_count}</div>
                <p className={`text-xs mt-3 font-medium ${dashboardData.security_vulnerabilities_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {dashboardData.security_vulnerabilities_count > 0 ? "⚠️ Critical fixes required" : "✅ Codebase is secure"}
                </p>
              </div>

              {/* Code Duplication Card */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-sm hover:border-slate-800 transition">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-slate-400">Code Duplication</span>
                  <Layers className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-white">{dashboardData.code_duplication_percentage}%</div>
                <p className="text-xs text-slate-500 mt-3">SonarQube threshold benchmark &lt; 10%</p>
              </div>

              {/* Total Lines of Code Card */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-sm hover:border-slate-800 transition">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-slate-400">Total Lines of Code</span>
                  <Code className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-3xl font-black text-white">{dashboardData.total_lines_of_code.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-3">Total executable codebase lines</p>
              </div>
            </div>

            {/* SQA Recharts Performance Data Visualization Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Response Time Area Line Chart */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 lg:col-span-2 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-white">Endpoint Performance (JMeter Mock)</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.performance_endpoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="endpoint" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="avg_response_time" name="Avg Response Time (ms)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Throughput and Error Bar Charts */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Server className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-white">Throughput & Error Rate</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.performance_endpoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="endpoint" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="throughput" name="Req/Sec" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="error_rate" name="Error %" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ========================================================
                SCAN REFORTS RECENT HISTORY COMPONENT
               ======================================================== */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">Recent SQA Scan Execution History</h3>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                      <th className="p-4">Report Token ID</th>
                      <th className="p-4">Engine Engine State</th>
                      <th className="p-4">Execution Target Timestamp</th>
                      <th className="p-4">Repository Remote Trace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="hover:bg-slate-950/40 transition">
                      <td className="p-4 font-mono text-xs text-blue-400">#{selectedProjectId.slice(0, 8)}...</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                          {dashboardData.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">Just now (Latest Synchronized)</td>
                      <td className="p-4 flex items-center gap-1.5 text-xs text-slate-400 max-w-xs truncate">
                        <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">Local SQA SQLite Pipeline</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}