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
  GitBranch,
  LayoutDashboard,
  Search,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

const SUPPORTED_LANGUAGES = ['Java', 'Python', 'JavaScript'];
const LANGUAGE_EXAMPLES = {
  Java: {
    fileName: 'UserService.java',
    code: `public class UserService {
  private String apiKey = "demo-secret";

  public void processUser() {
    try {
      System.out.println("Processing user data...");
    } catch (Exception e) {}
  }
}`
  },
  Python: {
    fileName: 'user_service.py',
    code: `class UserService:
    api_key = "demo-secret"

    def process_user(self):
        try:
            print("Processing user data...")
        except:
            pass`
  },
  JavaScript: {
    fileName: 'userService.js',
    code: `class UserService {
  constructor() {
    var apiKey = "demo-secret";
  }

  processUser() {
    console.log("Processing user data...");
  }
}`
  }
};

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
  const [activePage, setActivePage] = useState('dashboard');
  const [validationErrors, setValidationErrors] = useState({});
  const [issueSearch, setIssueSearch] = useState('');
  const [issueSeverity, setIssueSeverity] = useState('All');
  const [comparisonBaselineId, setComparisonBaselineId] = useState('');

  // Auth States
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', fullName: '' });
  const [authError, setAuthError] = useState('');
  const [authFieldErrors, setAuthFieldErrors] = useState({});
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          suggestion: 'Store credentials safely in environment variables (.env).',
          cause: 'A credential is embedded as a string literal, so it can be exposed through source control or bundled files.',
          impact: 'An attacker could reuse the exposed credential to access systems or data; rotating it may also interrupt integrations.'
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
          suggestion: 'Log the exception or rethrow it properly.',
          cause: 'The handler catches an exception but does not record it or recover from it.',
          impact: 'Failures become difficult to diagnose and the application may continue with incomplete or inconsistent state.'
        });
        deduction += 15;
      }

      if (lang === 'Python' && /^\s*except(?:\s+Exception)?\s*:/.test(line)) {
        issues.push({
          lineNumber: lineNum,
          issueType: 'Broad Exception Handler',
          severity: 'MEDIUM',
          message: 'Bare or overly broad exception catching detected.',
          suggestion: 'Catch only the exception types that can be handled safely.',
          cause: 'The handler can catch errors beyond the cases the code expects to recover from.',
          impact: 'Programming errors may be hidden, producing incorrect results and making failures harder to diagnose.'
        });
        deduction += 15;
      }

      if (lang === 'JavaScript' && /\bvar\s+/.test(line)) {
        issues.push({
          lineNumber: lineNum,
          issueType: 'Legacy Variable Declaration',
          severity: 'MEDIUM',
          message: "Legacy 'var' variable declaration detected.",
          suggestion: 'Use const or let to keep variables scoped to the intended block.',
          cause: 'The declaration is function-scoped and can be redeclared or visible outside the intended block.',
          impact: 'Unexpected variable reuse or scope leakage can produce hard-to-reproduce logic bugs.'
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
          suggestion: 'Replace stdout prints with a dedicated logger instance.',
          cause: 'Diagnostic output bypasses configurable application logging.',
          impact: 'Production logs may be noisy or unavailable to monitoring, slowing incident investigation.'
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

  const validateAuthField = (field, value) => {
    const trimmedValue = value.trim();
    if (field === 'fullName' && isRegister) {
      if (!trimmedValue) return 'Full name is required.';
      if (trimmedValue.length < 2) return 'Full name must contain at least 2 characters.';
      if (trimmedValue.length > 80) return 'Full name must be 80 characters or fewer.';
      if (/[\u0000-\u001F]/.test(trimmedValue)) return 'Full name cannot contain control characters.';
    }
    if (field === 'email') {
      if (!trimmedValue) return 'Email address is required.';
      if (trimmedValue.length > 254) return 'Email must be 254 characters or fewer.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) return 'Enter a valid email address.';
    }
    if (field === 'password') {
      if (!value) return 'Password is required.';
      if (isRegister && value.length < 8) return 'Password must contain at least 8 characters.';
      if (value.length > 72) return 'Password must be 72 characters or fewer.';
    }
    return '';
  };

  const updateAuthField = (field, value) => {
    setAuthData((previous) => ({ ...previous, [field]: value }));
    setAuthFieldErrors((previous) => ({
      ...previous,
      [field]: validateAuthField(field, value)
    }));
    setAuthError('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const fieldsToValidate = isRegister ? ['fullName', 'email', 'password'] : ['email', 'password'];
    const fieldErrors = Object.fromEntries(fieldsToValidate
      .map((field) => [field, validateAuthField(field, authData[field])])
      .filter(([, error]) => error));
    setAuthFieldErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const normalizedEmail = authData.email.trim();
    setAuthSubmitting(true);
    const endpoint = isRegister ? `${AUTH_BASE_URL}/register` : `${AUTH_BASE_URL}/login`;

    try {
      const response = await axios.post(endpoint, {
        email: normalizedEmail,
        password: authData.password,
        ...(isRegister ? { fullName: authData.fullName.trim() } : {})
      });
      setUser(response.data);
      localStorage.setItem('devreview_user', JSON.stringify(response.data));
      setShowAuthModal(false);
      setAuthData({ email: '', password: '', fullName: '' });
      setAuthFieldErrors({});
    } catch (error) {
      const responseMessage = error.response?.data;
      if (responseMessage && typeof responseMessage === 'object') {
        const { error: serverError, ...fieldErrors } = responseMessage;
        setAuthFieldErrors((previous) => ({ ...previous, ...fieldErrors }));
        setAuthError(serverError || '');
      } else {
        setAuthError(typeof responseMessage === 'string'
          ? responseMessage
          : 'Unable to reach the account service. Please try again.');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const switchAuthMode = () => {
    setIsRegister((previous) => !previous);
    setAuthError('');
    setAuthFieldErrors({});
    setShowPassword(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('devreview_user');
  };

  const handleAnalyze = async () => {
    const errors = {};
    const trimmedFileName = fileName.trim();
    if (!trimmedFileName || trimmedFileName.length > 255 || /[\\/:*?"<>|\u0000-\u001F]/.test(trimmedFileName)) {
      errors.fileName = 'Enter a valid file name (1–255 characters, without path separators or reserved characters).';
    }
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      errors.language = 'Select Java, Python, or JavaScript.';
    }
    if (!codeContent.trim()) {
      errors.codeContent = 'Paste source code before running the review.';
    } else if (codeContent.length > 100000) {
      errors.codeContent = 'Source code must be 100,000 characters or fewer.';
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setApiError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        fileName: trimmedFileName,
        language,
        codeContent,
        userEmail: user?.email || 'guest@devreview.com'
      });
      setCurrentAnalysis(response.data);
      await fetchHistoryAndStats();
    } catch (error) {
      if (error.response) {
        const details = error.response.data;
        setApiError(typeof details === 'string'
          ? details
          : Object.values(details || {}).join(' ') || 'The server rejected this review request.');
        return;
      }
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
    const trimmedUrl = githubUrl.trim();
    const githubRepoPattern = /^(?:https?:\/\/github\.com\/)?[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/;
    if (!githubRepoPattern.test(trimmedUrl)) {
      setApiError('Enter a GitHub repository URL in owner/repository format.');
      return;
    }
    setGithubLoading(true);
    setApiError(null);

    try {
      const cleaned = trimmedUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
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
        setCurrentAnalysis(null);
        setActivePage('review');
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

  const comparisonBaseline = history.find((item) =>
    String(item.id) === comparisonBaselineId
    && String(item.id) !== String(currentAnalysis?.id)
  );
  const comparison = (() => {
    if (!currentAnalysis || !comparisonBaseline) return null;
    const findingKey = (issue) => [
      issue.issueType?.trim().toLowerCase() || '',
      issue.message?.trim().toLowerCase() || ''
    ].join('|');
    const previousByKey = new Map();
    comparisonBaseline.issues.forEach((issue, index) => {
      const key = findingKey(issue);
      const matches = previousByKey.get(key) || [];
      matches.push({ issue, index });
      previousByKey.set(key, matches);
    });

    const currentFindings = currentAnalysis.issues.map((issue, index) => {
      const matches = previousByKey.get(findingKey(issue));
      const previous = matches?.shift();
      return { issue, index, status: previous ? 'Unchanged' : 'New' };
    });
    const fixedFindings = Array.from(previousByKey.values()).flat()
      .map(({ issue, index }) => ({ issue, index }));
    return {
      currentFindings,
      fixedFindings,
      newCount: currentFindings.filter(({ status }) => status === 'New').length,
      unchangedCount: currentFindings.filter(({ status }) => status === 'Unchanged').length,
      fixedCount: fixedFindings.length
    };
  })();

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    const example = LANGUAGE_EXAMPLES[selectedLanguage];
    setLanguage(selectedLanguage);
    setFileName(example.fileName);
    setCodeContent(example.code);
    setCurrentAnalysis(null);
    setValidationErrors({});
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const fileLanguage = extension === 'java' ? 'Java'
      : extension === 'py' ? 'Python'
        : ['js', 'jsx'].includes(extension) ? 'JavaScript' : null;

    if (!fileLanguage) {
      setApiError('Choose a .java, .py, .js, or .jsx source file.');
      event.target.value = '';
      return;
    }
    if (file.size > 100000) {
      setApiError('The selected file must be 100,000 bytes or fewer.');
      event.target.value = '';
      return;
    }

    try {
      const source = await file.text();
      if (!source.trim()) {
        setApiError('The selected source file is empty.');
        return;
      }
      setApiError(null);
      setFileName(file.name);
      setLanguage(fileLanguage);
      setCodeContent(source);
      setCurrentAnalysis(null);
      setValidationErrors({});
    } catch (error) {
      setApiError('Unable to read the selected file. Please choose another source file.');
      console.error('Error reading source file:', error);
    } finally {
      event.target.value = '';
    }
  };

  const lineCount = codeContent.split('\n').length;
  const visibleIssues = (currentAnalysis?.issues || []).filter((issue) => {
    const matchesSeverity = issueSeverity === 'All' || issue.severity?.toUpperCase() === issueSeverity.toUpperCase();
    const query = issueSearch.trim().toLowerCase();
    const matchesSearch = !query || [issue.issueType, issue.message, issue.cause, issue.impact, issue.suggestion]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesSeverity && matchesSearch;
  });

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

      <nav aria-label="Main navigation" className="border-b border-slate-800 bg-slate-950/80 px-6 print:hidden">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
            { id: 'review', label: 'Code Review', Icon: FileCode },
            { id: 'history', label: 'History', Icon: History }
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActivePage(id)}
              aria-current={activePage === id ? 'page' : undefined}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                activePage === id
                  ? 'border-blue-500 text-blue-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </nav>

      <section className="border-b border-slate-800 bg-slate-900/80 px-6 py-3 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <label htmlFor="github-repository-url" className="whitespace-nowrap text-xs font-semibold text-slate-300">
            Repository
          </label>
          <input
            id="github-repository-url"
            type="url"
            placeholder="https://github.com/owner/repo"
            aria-label="GitHub repository URL"
            maxLength={300}
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleGithubFetch}
            disabled={githubLoading}
            className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-600 disabled:opacity-50"
          >
            <GitBranch className="h-3.5 w-3.5" /> {githubLoading ? 'Fetching...' : 'Fetch Repo'}
          </button>
        </div>
      </section>

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

      {activePage === 'dashboard' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
          <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-blue-950/70 to-slate-800/70 p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Code quality workspace</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Find issues before they reach production.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Review Java, Python, and JavaScript code. Each finding explains the likely cause, the risk of leaving it unresolved, and a practical next step.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setActivePage('review')} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                Start a review
              </button>
            </div>
          </section>
          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Recent reviews</h3>
              <button onClick={() => setActivePage('history')} className="text-xs font-semibold text-blue-300 hover:text-blue-200">View all</button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">No reviews yet. Start one to build your review history.</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <button key={item.id} onClick={() => { setCurrentAnalysis(item); setActivePage('review'); }} className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-left hover:border-blue-500/50">
                    <span><span className="block text-sm font-semibold text-white">{item.fileName}</span><span className="text-xs text-slate-400">{item.language} · {item.totalIssues} issue(s)</span></span>
                    <span className="text-sm font-bold text-blue-300">{item.qualityScore}/100</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {activePage === 'history' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div><h2 className="text-2xl font-bold text-white">Review history</h2><p className="mt-1 text-sm text-slate-400">Open a report or remove a saved review.</p></div>
            <button onClick={() => setActivePage('review')} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">New review</button>
          </div>
          {history.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center text-sm text-slate-400">No saved reviews yet.</div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <button onClick={() => { setCurrentAnalysis(item); setActivePage('review'); }} className="text-left">
                    <span className="block font-semibold text-white">{item.fileName}</span>
                    <span className="mt-1 block text-xs text-slate-400">{item.language} · {item.totalIssues} issue(s)</span>
                  </button>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-blue-300">{item.qualityScore}/100</span>
                    <button onClick={(event) => handleDelete(event, item.id)} aria-label={`Delete ${item.fileName}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {activePage === 'review' && <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4 print:hidden">
          
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex flex-col space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileCode className="text-blue-400 w-5 h-5" /> New Code Review
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">File Name</label>
                <input
                  type="text"
                  id="review-file-name"
                  aria-invalid={Boolean(validationErrors.fileName)}
                  aria-describedby={validationErrors.fileName ? 'file-name-error' : undefined}
                  maxLength={255}
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
                {validationErrors.fileName && <p id="file-name-error" className="mt-1 text-xs text-rose-300">{validationErrors.fileName}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Language</label>
                <select
                  id="review-language"
                  aria-invalid={Boolean(validationErrors.language)}
                  value={language}
                  onChange={handleLanguageChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                </select>
                {validationErrors.language && <p className="mt-1 text-xs text-rose-300">{validationErrors.language}</p>}
              </div>
            </div>

            <div>
              <input
                id="source-file"
                type="file"
                accept=".java,.py,.js,.jsx"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <label
                htmlFor="source-file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-blue-500 hover:text-white"
              >
                <Upload className="h-4 w-4 text-blue-400" />
                Browse a source file
                <span className="text-xs text-slate-500">(.java, .py, .js, .jsx)</span>
              </label>
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
                  aria-label="Source code"
                  aria-invalid={Boolean(validationErrors.codeContent)}
                  aria-describedby={validationErrors.codeContent ? 'source-code-error' : undefined}
                  maxLength={100000}
                  required
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="w-full bg-transparent p-3 text-slate-200 focus:outline-none resize-y leading-6 font-mono border-none"
                  spellCheck="false"
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px]">
                {validationErrors.codeContent ? <p id="source-code-error" className="text-rose-300">{validationErrors.codeContent}</p> : <span className="text-slate-500">Maximum 100,000 characters</span>}
                <span className="text-slate-500">{codeContent.length.toLocaleString()} / 100,000</span>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || githubLoading}
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
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 print:text-slate-800">Detected Issues ({currentAnalysis.totalIssues})</h4>
                    <label htmlFor="comparison-baseline" className="mt-2 block text-[11px] text-slate-400 print:hidden">Compare with a previous scan</label>
                    <select
                      id="comparison-baseline"
                      value={comparisonBaselineId}
                      onChange={(event) => setComparisonBaselineId(event.target.value)}
                      className="mt-1 max-w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 print:hidden"
                    >
                      <option value="">Select a previous scan</option>
                      {history.filter((item) =>
                        String(item.id) !== String(currentAnalysis.id)
                        && item.fileName === currentAnalysis.fileName
                        && item.language === currentAnalysis.language
                      ).map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.fileName} · {item.qualityScore}/100 · {item.totalIssues} issue(s)
                        </option>
                      ))}
                    </select>
                  </div>
                  {currentAnalysis.issues.length > 0 && (
                    <div className="flex gap-2 print:hidden">
                      <label className="sr-only" htmlFor="issue-severity">Filter by severity</label>
                      <select id="issue-severity" value={issueSeverity} onChange={(event) => setIssueSeverity(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200">
                        {['All', 'CRITICAL', 'HIGH', 'WARNING', 'MEDIUM', 'INFO', 'LOW'].map((severity) => <option key={severity}>{severity}</option>)}
                      </select>
                      <label className="sr-only" htmlFor="issue-search">Search findings</label>
                      <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2">
                        <Search className="h-3.5 w-3.5 text-slate-500" />
                        <input id="issue-search" value={issueSearch} onChange={(event) => setIssueSearch(event.target.value)} maxLength={100} placeholder="Search findings" className="w-32 bg-transparent py-1.5 text-xs text-slate-200 outline-none" />
                      </div>
                    </div>
                  )}
                </div>
                {comparison && (
                  <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                    <p className="mb-2 text-xs text-slate-400">Compared with scan score {comparisonBaseline.qualityScore}/100</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-rose-500/10 p-2"><span className="block text-lg font-bold text-rose-300">{comparison.newCount}</span><span className="text-[10px] text-slate-400">New</span></div>
                      <div className="rounded-md bg-slate-700/50 p-2"><span className="block text-lg font-bold text-slate-200">{comparison.unchangedCount}</span><span className="text-[10px] text-slate-400">Unchanged</span></div>
                      <div className="rounded-md bg-emerald-500/10 p-2"><span className="block text-lg font-bold text-emerald-300">{comparison.fixedCount}</span><span className="text-[10px] text-slate-400">Fixed</span></div>
                    </div>
                  </div>
                )}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 print:max-h-none">
                  {currentAnalysis.issues.length === 0 && !comparison?.fixedFindings.length ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> No issues detected! Code is clean.
                    </div>
                  ) : currentAnalysis.issues.length === 0 ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> All findings from the selected scan are resolved.
                    </div>
                  ) : visibleIssues.length === 0 ? (
                    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">No findings match these filters.</div>
                  ) : (
                    visibleIssues.map((issue, idx) => {
                      const finding = comparison?.currentFindings.find(({ index }) => index === currentAnalysis.issues.indexOf(issue));
                      return (
                      <div key={idx} className="p-3.5 bg-slate-900 border border-slate-700/80 rounded-lg space-y-1 print:bg-slate-50 print:border-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 print:text-rose-600">
                            <ShieldAlert className="w-3.5 h-3.5" /> Line {issue.lineNumber} • {issue.issueType}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {finding && <span className={`text-[10px] border px-2 py-0.5 rounded font-bold ${finding.status === 'New' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>{finding.status}</span>}
                            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold">{issue.severity}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-200 font-medium print:text-slate-900">{issue.message}</p>
                        <p className="text-xs text-slate-400 print:text-slate-600"><strong className="text-slate-300 print:text-slate-800">Likely cause:</strong> {issue.cause || 'This pattern may indicate an unsafe or unreliable implementation.'}</p>
                        <p className="text-xs text-amber-200 print:text-amber-800"><strong>If unresolved:</strong> {issue.impact || 'The issue may cause defects, security exposure, or operational problems.'}</p>
                        <p className="text-xs text-slate-400 italic print:text-slate-600">💡 {issue.suggestion}</p>
                      </div>
                    )})
                  )}
                  {comparison?.fixedFindings.map(({ issue, index }) => (
                    <div key={`fixed-${index}`} className="rounded-lg border border-emerald-700/50 bg-emerald-950/20 p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-300">Line {issue.lineNumber} · {issue.issueType}</span>
                        <span className="rounded border border-emerald-700/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Fixed</span>
                      </div>
                      <p className="text-xs text-slate-300">{issue.message}</p>
                    </div>
                  ))}
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
      </main>}

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

            <form onSubmit={handleAuthSubmit} noValidate className="space-y-4">
              {isRegister && (
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      autoComplete="name"
                      aria-invalid={Boolean(authFieldErrors.fullName)}
                      aria-describedby={authFieldErrors.fullName ? 'auth-name-error' : 'auth-name-hint'}
                      maxLength={80}
                      placeholder="Dev Name"
                      value={authData.fullName}
                      onChange={(e) => updateAuthField('fullName', e.target.value)}
                      onBlur={(e) => setAuthFieldErrors((previous) => ({ ...previous, fullName: validateAuthField('fullName', e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {authFieldErrors.fullName
                    ? <p id="auth-name-error" className="mt-1 text-xs text-rose-300">{authFieldErrors.fullName}</p>
                    : <p id="auth-name-hint" className="mt-1 text-xs text-slate-500">Use 2–80 characters.</p>}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(authFieldErrors.email)}
                    aria-describedby={authFieldErrors.email ? 'auth-email-error' : undefined}
                    maxLength={254}
                    placeholder="dev@example.com"
                    value={authData.email}
                    onChange={(e) => updateAuthField('email', e.target.value)}
                    onBlur={(e) => setAuthFieldErrors((previous) => ({ ...previous, email: validateAuthField('email', e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {authFieldErrors.email && <p id="auth-email-error" className="mt-1 text-xs text-rose-300">{authFieldErrors.email}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    aria-invalid={Boolean(authFieldErrors.password)}
                    aria-describedby={authFieldErrors.password ? 'auth-password-error' : 'auth-password-hint'}
                    maxLength={72}
                    placeholder="••••••••"
                    value={authData.password}
                    onChange={(e) => updateAuthField('password', e.target.value)}
                    onBlur={(e) => setAuthFieldErrors((previous) => ({ ...previous, password: validateAuthField('password', e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {authFieldErrors.password
                  ? <p id="auth-password-error" className="mt-1 text-xs text-rose-300">{authFieldErrors.password}</p>
                  : <p id="auth-password-hint" className="mt-1 text-xs text-slate-500">{isRegister ? 'Use 8–72 characters.' : 'Enter your password.'}</p>}
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all text-sm"
              >
                {authSubmitting ? 'Please wait...' : isRegister ? 'Register Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={switchAuthMode}
                className="text-xs text-blue-400 hover:underline"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-center text-xs leading-5 text-slate-500 print:hidden">
        <p>DevReview</p>
        <p>© 2026 AM</p>
        <p>All rights reserved by AM.</p>
      </footer>
    </div>
  );
}