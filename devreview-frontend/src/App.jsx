import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Code2, 
  CheckCircle, 
  ShieldAlert, 
  FileCode, 
  History, 
  ArrowRight, 
  Download, 
  Printer, 
  Wand2, 
  BarChart3, 
  AlertTriangle, 
  Activity, 
  Trash2, 
  LogIn, 
  LogOut, 
  User, 
  Lock, 
  Mail, 
  X, 
  GitBranch
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

export default function App() {
  const [fileName, setFileName] = useState('UserService.java');
  const [language, setLanguage] = useState('Java');
  const [codeContent, setCodeContent] = useState(
    `public class UserService {\n  private String apiKey = "secret_key_12345";\n  \n  public void processUser() {\n    try {\n      System.out.println("Processing user data...");\n    } catch (Exception e) {}\n  }\n}`
  );

  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalScans: 0, averageQualityScore: 100, totalIssuesFound: 0 });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Auth States
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', fullName: '' });
  const [authError, setAuthError] = useState('');

  // Scanner States
  const [githubUrl, setGithubUrl] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:8081/api/analyses';
  const AUTH_BASE_URL = 'http://localhost:8081/api/auth';

  useEffect(() => {
    const storedUser = localStorage.getItem('devreview_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('devreview_user');
      }
    }
  }, []);

  const fetchHistoryAndStats = async () => {
    try {
      setApiError(null);
      const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
      const historyRes = await axios.get(`${API_BASE_URL}${emailParam}`);
      const statsRes = await axios.get(`${API_BASE_URL}/stats${emailParam}`);

      if (historyRes.data) setHistory(historyRes.data);
      if (statsRes.data) setStats(statsRes.data);
    } catch (error) {
      console.warn("Backend unaccessible. Running in offline web-demo engine mode.");
    }
  };

  useEffect(() => {
    fetchHistoryAndStats();
  }, [user]);

  useEffect(() => {
    try {
      Prism.highlightAll();
    } catch (e) {
      console.error("Prism syntax error:", e);
    }
  }, [codeContent, language]);

  // Client-Side Offline Analysis Engine for Vercel Web Demo
  const runOfflineAnalysis = (code, lang, name) => {
    const lines = code.split('\n');
    const issues = [];
    let deduction = 0;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      
      // Hardcoded secrets / API keys
      if (/api[_-]?key\s*=\s*["'][^"']+["']/i.test(line) || /secret[_-]?key\s*=\s*["'][^"']+["']/i.test(line)) {
        issues.push({
          lineNumber: lineNum,
          issueType: 'Hardcoded Credentials',
          severity: 'HIGH',
          message: 'Hardcoded secret or API key detected in source code.',
          suggestion: 'Store credentials safely in environment variables (.env).'
        });
        deduction += 25;
      }

      // Empty catch block
      if (/catch\s*\([^)]+\)\s*\{\s*\}/.test(line) || (line.includes('catch') && lines[idx+1] && lines[idx+1].trim() === '}')) {
        issues.push({
          lineNumber: lineNum,
          issueType: 'Empty Catch Block',
          severity: 'MEDIUM',
          message: 'Empty catch block suppresses critical runtime exceptions.',
          suggestion: 'Log the exception or rethrow it properly.'
        });
        deduction += 15;
      }

      // Print statements / Console logs
      if (line.includes('System.out.print') || line.includes('print(') || line.includes('console.log(')) {
        issues.push({
          lineNumber: lineNum,
          issueType: 'Console Print Statement',
          severity: 'LOW',
          message: 'Raw print/log statements found in application logic.',
          suggestion: 'Replace stdout prints with a dedicated logger instance.'
        });
        deduction += 10;
      }
    });

    const qualityScore = Math.max(0, 100 - deduction);
    const mockReport = {
      id: Date.now(),
      fileName: name,
      language: lang,
      qualityScore,
      totalIssues: issues.length,
      issues,
      userEmail: user?.email || 'demo@devreview.com'
    };

    return mockReport;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegister ? `${AUTH_BASE_URL}/register` : `${AUTH_BASE_URL}/login`;

    try {
      const response = await axios.post(endpoint, authData);
      setUser(response.data);
      localStorage.setItem('devreview_user', JSON.stringify(response.data));
      setShowAuthModal(false);
      setAuthData({ email: '', password: '', fullName: '' });
    } catch (error) {
      // Offline fallback login for live web demo
      const demoUser = {
        fullName: authData.fullName || authData.email.split('@')[0],
        email: authData.email
      };
      setUser(demoUser);
      localStorage.setItem('devreview_user', JSON.stringify(demoUser));
      setShowAuthModal(false);
      setAuthData({ email: '', password: '', fullName: '' });
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('devreview_user');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        fileName,
        language,
        codeContent,
        userEmail: user?.email || 'guest@devreview.com'
      });
      setCurrentAnalysis(response.data);
      await fetchHistoryAndStats();
    } catch (error) {
      // Fallback to client-side static analysis engine
      const fallbackReport = runOfflineAnalysis(codeContent, language, fileName);
      setCurrentAnalysis(fallbackReport);
      
      setHistory(prev => [fallbackReport, ...prev]);
      setStats(prev => ({
        totalScans: prev.totalScans + 1,
        averageQualityScore: Math.round((prev.averageQualityScore * prev.totalScans + fallbackReport.qualityScore) / (prev.totalScans + 1)),
        totalIssuesFound: prev.totalIssuesFound + fallbackReport.totalIssues
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleRefactor = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/refactor`, {
        language,
        codeContent
      });
      setCodeContent(response.data);
    } catch (error) {
      // Offline client refactoring
      let refactored = codeContent;
      refactored = refactored.replace(/private\s+String\s+apiKey\s*=\s*["'][^"']+["'];/g, 'private String apiKey = System.getenv("API_KEY");');
      refactored = refactored.replace(/System\.out\.println\(([^)]+)\);/g, 'logger.info($1);');
      refactored = refactored.replace(/catch\s*\((Exception\s+\w+)\)\s*\{\s*\}/g, 'catch ($1) {\n      logger.error("Error occurred: ", e);\n    }');
      setCodeContent(refactored);
    }
  };

  const handleGithubFetch = async () => {
    if (!githubUrl) return;
    setGithubLoading(true);
    setApiError(null);

    try {
      const cleaned = githubUrl.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      const parts = cleaned.split('/');

      if (parts.length < 2) {
        setApiError("Please enter a valid GitHub repository URL (e.g., owner/repository).");
        setGithubLoading(false);
        return;
      }

      const owner = parts[0];
      const repo = parts[1];

      const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
      const defaultBranch = repoRes.data.default_branch || 'main';

      const targetFiles = [
        'src/App.jsx', 'src/App.js', 'src/index.js', 'src/main.js',
        'main.py', 'app.py', 'index.js', 'App.js', 'UserService.java'
      ];

      let fetchedContent = null;
      let matchedFileName = '';

      for (const filePath of targetFiles) {
        try {
          const rawRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`);
          if (rawRes.data) {
            fetchedContent = rawRes.data;
            matchedFileName = filePath.split('/').pop();
            break;
          }
        } catch (e) {
          // File not present at this specific path
        }
      }

      if (fetchedContent) {
        setFileName(matchedFileName);
        setLanguage(
          matchedFileName.endsWith('.py') ? 'Python' :
          matchedFileName.endsWith('.java') ? 'Java' : 'JavaScript'
        );
        setCodeContent(typeof fetchedContent === 'string' ? fetchedContent : JSON.stringify(fetchedContent, null, 2));
      } else {
        setApiError(`Could not locate a standard source file in ${owner}/${repo} on branch '${defaultBranch}'.`);
      }
    } catch (error) {
      console.error("Error fetching Repository file:", error);
      setApiError("Unable to fetch repository file directly. Ensure the repo is public and the URL is correct.");
    } finally {
      setGithubLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
    } catch (error) {
      console.warn("Deleting local session item");
    }
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentAnalysis?.id === id) {
      setCurrentAnalysis(null);
    }
  };

  const exportJSON = () => {
    if (!currentAnalysis) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentAnalysis, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${currentAnalysis.fileName}_review.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const lineCount = codeContent.split('\n').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans print:bg-white print:text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          <Code2 className="text-blue-500 w-8 h-8" />
          <h1 className="text-xl font-bold tracking-wide text-white">DevReview</h1>
          <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 font-medium">Automated Engine</span>
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-xs font-semibold text-white">{user.fullName || 'Developer'}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}
        </div>
      </header>

      {apiError && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-400 px-6 py-2 text-xs text-center font-semibold">
          ⚠️ {apiError}
        </div>
      )}

      {/* Metrics Banner */}
      <section className="bg-slate-950/60 border-b border-slate-800 px-6 py-3 print:hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 border-r border-slate-800 pr-4">
            <Activity className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Scans</p>
              <p className="text-base font-bold text-white">{stats.totalScans}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 border-r border-slate-800 pr-4">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Quality Score</p>
              <p className="text-base font-bold text-white">{stats.averageQualityScore} / 100</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Issues Identified</p>
              <p className="text-base font-bold text-white">{stats.totalIssuesFound}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4 print:hidden">
          
          {/* Quick Import Toolbar */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleGithubFetch}
              disabled={githubLoading}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <GitBranch className="w-3.5 h-3.5" /> {githubLoading ? 'Fetching...' : 'Fetch Repo'}
            </button>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex flex-col space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileCode className="text-blue-400 w-5 h-5" /> New Code Review
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Source Code</label>
              <div className="relative flex bg-slate-950 border border-slate-700 rounded-lg overflow-hidden font-mono text-sm">
                <div className="bg-slate-900 border-r border-slate-800 text-slate-500 select-none py-3 px-2 text-right text-xs leading-6">
                  {Array.from({ length: lineCount }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <textarea
                  rows={9}
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="w-full bg-transparent p-3 text-slate-200 focus:outline-none resize-y leading-6 font-mono border-none"
                  spellCheck="false"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Run Automated Analysis'}
            </button>
          </div>

          {/* History Sidebar */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-slate-300">
              <History className="w-4 h-4 text-blue-400" /> Recent Scans ({history.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No past analyses stored yet.</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentAnalysis(item)}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      currentAnalysis?.id === item.id
                        ? 'bg-blue-600/20 border-blue-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-700/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <span className="font-semibold block">{item.fileName}</span>
                      <span className="text-[10px] text-slate-400">{item.language} • {item.totalIssues} issue(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${item.qualityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.qualityScore}/100
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        title="Delete Scan"
                        className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 flex flex-col space-y-4 print:col-span-12">
          {currentAnalysis ? (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-5 print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4 print:border-slate-300">
                <div>
                  <h3 className="text-lg font-bold text-white print:text-slate-900">{currentAnalysis.fileName}</h3>
                  <span className="text-xs text-slate-400 print:text-slate-600">Language: {currentAnalysis.language}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2 print:hidden">
                    <button
                      onClick={handleRefactor}
                      title="Auto-Fix Code"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Wand2 className="w-3.5 h-3.5" /> Auto-Fix Code
                    </button>
                    <button
                      onClick={exportJSON}
                      title="Export JSON"
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-all"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handlePrint}
                      title="Print or Save PDF"
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-all"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-blue-400 print:text-blue-600">{currentAnalysis.qualityScore} / 100</div>
                    <span className="text-xs text-slate-400 print:text-slate-600">Quality Score</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 print:text-slate-800">Detected Issues ({currentAnalysis.totalIssues})</h4>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 print:max-h-none">
                  {currentAnalysis.issues.length === 0 ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> No issues detected! Code is clean.
                    </div>
                  ) : (
                    currentAnalysis.issues.map((issue, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-900 border border-slate-700/80 rounded-lg space-y-1 print:bg-slate-50 print:border-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 print:text-rose-600">
                            <ShieldAlert className="w-3.5 h-3.5" /> Line {issue.lineNumber} • {issue.issueType}
                          </span>
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium print:text-slate-900">{issue.message}</p>
                        <p className="text-xs text-slate-400 italic print:text-slate-600">💡 {issue.suggestion}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[350px]">
              <Code2 className="w-12 h-12 mb-2 stroke-1" />
              <p className="text-sm">Run an analysis or select a past report from the sidebar.</p>
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 relative space-y-5">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white">
                {isRegister ? 'Create Developer Account' : 'Welcome Back'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isRegister ? 'Register to manage your isolated code reviews' : 'Sign in to access your saved analysis history'}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Dev Name"
                      value={authData.fullName}
                      onChange={(e) => setAuthData({ ...authData, fullName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="dev@example.com"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all text-sm"
              >
                {isRegister ? 'Register Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
                className="text-xs text-blue-400 hover:underline"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}