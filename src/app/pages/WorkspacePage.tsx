import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { 
  Terminal, 
  Plus, 
  Trash2, 
  Send, 
  FileText, 
  Globe, 
  Youtube, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  ArrowLeft,
  X,
  Upload,
  BookOpen,
  AlertCircle,
  ExternalLink,
  Bot,
  User,
  Zap,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PanelRightOpen,
  PanelRightClose,
  Layers,
  Copy,
  Check,
  Download
} from 'lucide-react';

import { FileUpload } from '../components/ui/file-upload';
import { PlaceholdersAndVanishInput } from '../components/ui/placeholders-and-vanish-input';

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'vtt' | 'website' | 'youtube';
  status: 'indexing' | 'indexed' | 'failed';
  createdAt?: string;
}

interface Citation {
  sourceName: string;
  sourceType: string;
  url?: string;
  heading?: string;
  startTime?: string;
  endTime?: string;
  pageHint?: number;
  text: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  usedRAG?: boolean;
}

interface WorkspacePageProps {
  onBackToHome: () => void;
  onBackToDashboard?: () => void;
  notebookId?: string;
  notebookTitle?: string;
}

// Format seconds into MM:SS timestamp e.g. 75.4 -> 01:15
function formatTimestamp(secondsStr?: string): string {
  if (!secondsStr) return '';
  const totalSec = Math.floor(parseFloat(secondsStr));
  if (isNaN(totalSec)) return '';
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Generate YouTube deep link with ?t=...s
function getYouTubeLink(url?: string, startTime?: string): string {
  if (!url) return '#';
  const startSec = Math.floor(parseFloat(startTime || '0'));
  if (url.includes('?v=')) {
    return `${url}&t=${startSec}s`;
  }
  return `${url}?t=${startSec}s`;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  onBackToHome,
  onBackToDashboard,
  notebookId,
  notebookTitle: propNotebookTitle,
}) => {
  const { getToken } = useAuth();
  const { user } = useUser();

  // State Management
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [urlKind, setUrlKind] = useState<'website' | 'youtube'>('website');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [notebookTitle, setNotebookTitle] = useState(propNotebookTitle || 'My AI Knowledge Base');
  
  useEffect(() => {
    if (propNotebookTitle) {
      setNotebookTitle(propNotebookTitle);
    }
  }, [propNotebookTitle]);

  // Right sidebar citation state
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [activeCitationIndex, setActiveCitationIndex] = useState<number | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear Chat History
  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear chat history for this notebook?")) return;
    try {
      const headers = await getAuthHeaders();
      const endpoint = notebookId
        ? `/api/rag/query/history?notebookId=${notebookId}`
        : '/api/rag/query/history';
      await fetch(endpoint, { method: 'DELETE', headers });
      setMessages([]);
      setActiveCitations([]);
      setActiveCitationIndex(null);
      setActiveMessageId(null);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // Export Chat as Markdown
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const lines = [`# ${notebookTitle} Transcript\nDate: ${new Date().toLocaleString()}\n\n---\n`];
    messages.forEach(m => {
      const role = m.role === 'user' ? '👤 User' : '🤖 ContextAI';
      lines.push(`### ${role}\n${m.content}\n`);
      if (m.citations && m.citations.length > 0) {
        lines.push(`**Sources Cited:**`);
        m.citations.forEach(c => {
          lines.push(`- [${c.sourceType.toUpperCase()}] ${c.sourceName}: "${c.text.slice(0, 100)}..."`);
        });
        lines.push('\n');
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notebookTitle.replace(/\s+/g, '-')}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper to build headers with Clerk Bearer token
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoadingQuery]);

  // Fetch Sources
  const fetchSources = async () => {
    try {
      const headers = await getAuthHeaders();
      const endpoint = notebookId
        ? `/api/rag/sources?notebookId=${notebookId}`
        : '/api/rag/sources';
      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  };

  // Fetch History
  const fetchHistory = async () => {
    try {
      const headers = await getAuthHeaders();
      const endpoint = notebookId
        ? `/api/rag/query/history?notebookId=${notebookId}`
        : '/api/rag/query/history';
      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        const history: ChatMessage[] = data.messages || [];
        setMessages(history);

        const lastAssistant = [...history].reverse().find(m => m.role === 'assistant' && m.citations && m.citations.length > 0);
        if (lastAssistant && lastAssistant.citations) {
          setActiveCitations(lastAssistant.citations);
          setActiveMessageId(lastAssistant.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchSources();
    fetchHistory();
  }, [notebookId]);

  // Keyboard shortcut listener (Esc closes modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddingSource) {
        setIsAddingSource(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddingSource]);

  // Poll indexing sources every 3 seconds if any source is in "indexing" state
  useEffect(() => {
    const hasIndexing = sources.some(s => s.status === 'indexing');
    if (!hasIndexing) return;

    const timer = setInterval(() => {
      fetchSources();
    }, 3000);

    return () => clearInterval(timer);
  }, [sources, notebookId]);

  // Handle URL Source Upload
  const handleAddUrlSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setErrorMsg(null);
    setIsUploading(true);

    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';

      const res = await fetch('/api/rag/sources/url', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: urlInput,
          type: urlKind,
          ...(notebookId ? { notebookId } : {})
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add URL source');
      }

      setUrlInput('');
      setIsAddingSource(false);
      fetchSources();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding URL source');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle File Upload (PDF/VTT)
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setErrorMsg(null);
    setIsUploading(true);

    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (notebookId) {
        formData.append('notebookId', notebookId);
      }

      const res = await fetch('/api/rag/sources/file', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file source');
      }

      setSelectedFile(null);
      setIsAddingSource(false);
      fetchSources();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Source
  const handleDeleteSource = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/rag/sources/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setSources(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete source:', err);
    }
  };

  // Submit Query to RAG HyDE Pipeline
  const handleSendQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isLoadingQuery) return;

    const userMessageText = inputQuery.trim();
    setInputQuery('');
    setErrorMsg(null);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageText
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoadingQuery(true);

    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';

      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessageText,
          ...(notebookId ? { notebookId } : {})
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const citations: Citation[] = data.citations || [];

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        citations,
        usedRAG: data.usedRAG
      };

      setMessages(prev => [...prev, assistantMsg]);
      setRequestCount(prev => prev + 1);

      if (citations.length > 0) {
        setActiveCitations(citations);
        setActiveMessageId(assistantMsg.id);
        setIsRightSidebarOpen(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate response');
    } finally {
      setIsLoadingQuery(false);
    }
  };

  // Open Citation Inspector
  const handleOpenCitationInspector = (citations: Citation[], msgId: string, idx?: number) => {
    setActiveCitations(citations);
    setActiveMessageId(msgId);
    setActiveCitationIndex(idx !== undefined ? idx : null);
    setIsRightSidebarOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans flex flex-col selection:bg-white selection:text-black">
      
      {/* ── TOP NAVBAR ────────────────────────────────────────────────── */}
      <header className="h-18 border-b border-white/10 bg-[#08080a] px-6 md:px-10 flex items-center justify-between z-30 sticky top-0">
        
        {/* Left: Navigation & Workspace Title */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBackToDashboard || onBackToHome}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-mono"
            title="Back to Notebooks Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Notebooks</span>
          </button>

          <div className="flex items-center space-x-3 pl-3 border-l border-white/10">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Terminal className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2.5">
                <span className="font-mono font-bold text-white text-sm md:text-base truncate max-w-[200px] md:max-w-[320px]">{notebookTitle}</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                  NotebookLM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions, Counter & User Account Badge */}
        <div className="flex items-center space-x-3.5">
          {messages.length > 0 && (
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleExportChat}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer font-mono text-xs flex items-center space-x-2"
                title="Export Transcript as Markdown"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Export</span>
              </button>

              <button
                onClick={handleClearHistory}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer font-mono text-xs flex items-center space-x-2"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Clear</span>
              </button>
            </div>
          )}

          <div className="hidden sm:flex items-center space-x-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl font-mono text-xs text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{requestCount}/10 Queries Today</span>
          </div>

          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className={`px-3.5 py-2 rounded-xl font-mono text-xs border transition-all flex items-center space-x-2 cursor-pointer ${
              isRightSidebarOpen
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white'
            }`}
            title={isRightSidebarOpen ? "Hide Citations Panel" : "Show Citations Panel"}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Citations</span>
            {activeCitations.length > 0 && (
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded-full border border-emerald-500/40 text-emerald-300 font-bold">
                {activeCitations.length}
              </span>
            )}
            {isRightSidebarOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
            )}
          </button>

          <div className="flex items-center space-x-3 pl-3 border-l border-white/10">
            <div className="text-right hidden md:block">
              <div className="text-xs font-mono font-semibold text-white">{user?.firstName || user?.username || 'Developer'}</div>
              <div className="text-[10px] font-mono text-emerald-400">Vault Connected</div>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 rounded-lg border border-white/20'
                }
              }}
            />
          </div>
        </div>

      </header>

      {/* ── MAIN WORKSPACE CONTAINER (3-column) ──────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── LEFT SIDEBAR — SOURCES ─────────────────────────────────── */}
        <aside className="w-76 lg:w-84 border-r border-white/10 bg-[#060608] p-5 md:p-6 flex flex-col shrink-0 overflow-y-auto z-20">
          <div className="space-y-6 flex-1">
            <div className="pb-4 border-b border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">Sources ({sources.length}/5)</span>
                </div>
                {sources.length < 5 && (
                  <button
                    onClick={() => setIsAddingSource(true)}
                    className="px-3 py-1.5 rounded-xl bg-white text-black font-mono text-[11px] font-bold hover:bg-zinc-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {/* Progress Quota Bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                  style={{ width: `${(sources.length / 5) * 100}%` }} 
                />
              </div>
            </div>

            {sources.length === 0 ? (
              <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center space-y-4">
                <Layers className="w-9 h-9 text-zinc-600 mx-auto" />
                <div className="font-mono text-xs text-zinc-300 font-bold">No sources yet</div>
                <p className="font-mono text-[11px] text-zinc-500 leading-relaxed">
                  Upload PDFs, VTT docs, websites, or YouTube links to power your RAG search.
                </p>
                <button
                  onClick={() => setIsAddingSource(true)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-mono text-white border border-white/15 transition-all w-full cursor-pointer"
                >
                  + Add First Source
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map(s => {
                  const isIndexing = s.status === 'indexing';
                  const isIndexed = s.status === 'indexed';
                  return (
                    <div key={s.id} className="group relative bg-[#0b0b0e] border border-white/15 hover:border-white/30 rounded-2xl p-3.5 transition-all flex items-center justify-between shadow-md">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          {s.type === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                          {s.type === 'vtt' && <FileText className="w-4 h-4 text-amber-400" />}
                          {s.type === 'website' && <Globe className="w-4 h-4 text-blue-400" />}
                          {s.type === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-xs text-white truncate font-medium">{s.name}</div>
                          <div className="flex items-center space-x-1.5 pt-1">
                            {isIndexing && (
                              <span className="flex items-center text-[10px] font-mono text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mr-1" />
                                Indexing...
                              </span>
                            )}
                            {isIndexed && (
                              <span className="flex items-center text-[10px] font-mono text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                                Indexed
                              </span>
                            )}
                            {s.status === 'failed' && (
                              <span className="flex items-center text-[10px] font-mono text-rose-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1" />
                                Failed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSource(s.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                        title="Delete Source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-zinc-600 text-center">
            Knowledge Vault
          </div>
        </aside>

        {/* ── CENTER CHAT WORKSPACE ──────────────────────────────────── */}
        <section className="flex-1 flex flex-col bg-[#030303] relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 max-w-4xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-12">
                <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-mono font-bold text-white">Ask Anything About Your Sources</h3>
                <p className="text-xs font-mono text-zinc-400 max-w-md">
                  Add sources in the left panel, ask questions here. Citations appear in the right panel.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full pt-4 font-mono text-xs">
                  <button
                    onClick={() => setInputQuery("Summarize the key findings from my uploaded documents.")}
                    className="p-3 bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-left text-zinc-300 hover:text-white transition-all"
                  >
                    💡 "Summarize the key findings from my sources..."
                  </button>
                  <button
                    onClick={() => setInputQuery("What are the main concepts in my YouTube videos?")}
                    className="p-3 bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-left text-zinc-300 hover:text-white transition-all"
                  >
                    🎥 "What are the main concepts in my videos?"
                  </button>
                </div>
              </div>
            ) : (
              messages.map(m => {
                const isUser = m.role === 'user';
                const hasCitations = m.citations && m.citations.length > 0;
                return (
                  <div key={m.id} className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUser ? 'bg-white text-black' : 'bg-white/10 text-white border border-white/20'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className={`max-w-2xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`relative group p-4 rounded-2xl font-sans text-sm leading-relaxed ${
                        isUser
                          ? 'bg-white text-black font-medium shadow-md'
                          : 'glass-panel text-zinc-200 border border-white/10'
                      }`}>
                        {m.content}

                        {!isUser && (
                          <button
                            onClick={() => handleCopyText(m.id, m.content)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 border border-white/10 text-zinc-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                      {hasCitations && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-mono text-zinc-500 uppercase font-bold flex items-center">
                            <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1" />
                            <span>Sources Used (click to inspect →):</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                            {m.citations!.map((c, idx) => {
                              const isYT = c.sourceType === 'youtube';
                              const startTimeFormatted = formatTimestamp(c.startTime);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleOpenCitationInspector(m.citations!, m.id, idx)}
                                  className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0d0d12] border border-white/15 hover:border-white/40 hover:bg-white/10 text-zinc-200 hover:text-white transition-all cursor-pointer shadow-sm"
                                >
                                  {isYT ? (
                                    <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  ) : c.sourceType === 'pdf' ? (
                                    <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  ) : (
                                    <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  )}
                                  <span className="truncate max-w-[150px] font-medium text-[11px]">
                                    {c.sourceName || 'Source'}
                                  </span>
                                  {isYT && startTimeFormatted && (
                                    <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-semibold border border-red-500/20">
                                      {startTimeFormatted}
                                    </span>
                                  )}
                                  <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isLoadingQuery && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 text-white border border-white/20 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="glass-panel p-4 rounded-2xl font-mono text-xs text-zinc-400 flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Synthesizing HyDE vector query & searching Pinecone...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Form with Aceternity PlaceholdersAndVanishInput */}
          <div className="p-4 md:p-6 border-t border-white/10 bg-[#050507]">
            <PlaceholdersAndVanishInput
              placeholders={[
                "Summarize the key findings from my uploaded documents...",
                "What are the main concepts in my YouTube video?",
                "Extract important code snippets and citations...",
                "What is the conclusion of the research paper?",
                "Ask anything about your PDF, Web or VTT sources..."
              ]}
              value={inputQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputQuery(e.target.value)}
              onSubmit={() => handleSendQuery()}
              disabled={isLoadingQuery}
            />
            {errorMsg && (
              <div className="max-w-4xl mx-auto mt-2 text-rose-400 font-mono text-xs flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </section>

        {/* ── RIGHT SIDEBAR — CITATIONS / ANSWER SOURCES ─────────────── */}
        {isRightSidebarOpen && (
          <aside className="w-80 lg:w-96 border-l border-white/10 bg-[#060608] p-5 flex flex-col shrink-0 overflow-y-auto z-20 shadow-2xl animate-fadeIn">
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">Answer Sources</span>
                  {activeCitations.length > 0 && (
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                      {activeCitations.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsRightSidebarOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeCitations.length === 0 ? (
                <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="font-mono text-xs text-white font-bold">No Citations Yet</div>
                  <p className="font-mono text-[10px] text-zinc-500 leading-relaxed">
                    Ask a question and the source chunks used to generate the answer will appear here with full text, timestamps, and links.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>Retrieved Chunks ({activeCitations.length})</span>
                    <span className="text-emerald-400 font-bold">HyDE Grounded</span>
                  </div>

                  {activeCitations.map((c, idx) => {
                    const isYT = c.sourceType === 'youtube';
                    const startTimeFormatted = formatTimestamp(c.startTime);
                    const endTimeFormatted = formatTimestamp(c.endTime);
                    const ytLink = isYT ? getYouTubeLink(c.url, c.startTime) : (c.url || '#');
                    const isExpanded = activeCitationIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`bg-[#0c0c0f] border rounded-2xl overflow-hidden shadow-lg transition-all ${
                          isExpanded
                            ? 'border-emerald-400/60 bg-emerald-500/[0.03] ring-1 ring-emerald-400/30'
                            : 'border-white/15 hover:border-white/30'
                        }`}
                      >
                        {/* ── 1-LINE HEADER (Clickable to Expand / Collapse) ── */}
                        <button
                          type="button"
                          onClick={() => setActiveCitationIndex(isExpanded ? null : idx)}
                          className="w-full p-3.5 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              {isYT && <Youtube className="w-3.5 h-3.5 text-red-500" />}
                              {c.sourceType === 'pdf' && <FileText className="w-3.5 h-3.5 text-rose-400" />}
                              {c.sourceType === 'website' && <Globe className="w-3.5 h-3.5 text-blue-400" />}
                              {c.sourceType === 'vtt' && <FileText className="w-3.5 h-3.5 text-amber-400" />}
                            </div>

                            <span className="font-mono text-xs text-white font-bold truncate">
                              {c.sourceName || 'Source Chunk'}
                            </span>

                            {isYT && startTimeFormatted && (
                              <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-mono font-semibold border border-red-500/20 shrink-0 hidden sm:inline-block">
                                [{startTimeFormatted}]
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-zinc-300">
                              {c.sourceType}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        </button>

                        {/* ── EXPANDED DETAILS BODY ── */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3 animate-fadeIn">
                            {isYT && (c.startTime || c.endTime) && (
                              <div className="pt-1">
                                <a
                                  href={ytLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Timestamp: [{startTimeFormatted || '00:00'} - {endTimeFormatted || '00:00'}]</span>
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </div>
                            )}

                            {!isYT && c.url && (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-blue-400 hover:underline font-mono text-[11px] truncate max-w-full"
                              >
                                <span>{c.url}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            )}

                            {!isYT && c.pageHint && (
                              <div className="text-[11px] font-mono text-zinc-400">
                                Page Hint: ~Page {c.pageHint}
                              </div>
                            )}

                            <div className="bg-black/80 rounded-xl p-3 border border-white/10 font-mono text-xs text-zinc-300 leading-relaxed italic border-l-2 border-l-white/30">
                              "{c.text}"
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 text-[10px] font-mono text-zinc-600 text-center">
              Citation Inspector
            </div>
          </aside>
        )}

      </div>

      {/* ── TOGGLE RIGHT SIDEBAR (floating tab button when closed) ─────── */}
      {!isRightSidebarOpen && (
        <button
          onClick={() => setIsRightSidebarOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center space-x-2 py-3 px-2.5 rounded-l-2xl bg-[#0b0b0e] border-l border-t border-b border-white/20 hover:border-emerald-400/50 hover:bg-[#121217] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-2xl group backdrop-blur-md"
          title="Open Citations Inspector"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-mono text-xs font-bold text-white [writing-mode:vertical-lr] rotate-180 py-1 tracking-wider uppercase">
            Citations {activeCitations.length > 0 ? `(${activeCitations.length})` : ''}
          </span>
          <PanelRightOpen className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
        </button>
      )}

      {/* ── ADD SOURCE MODAL ──────────────────────────────────────────── */}
      {isAddingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl space-y-6">
            <button
              onClick={() => setIsAddingSource(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <h3 className="text-xl font-mono font-bold text-white">Add New Source</h3>
              <p className="text-xs font-mono text-zinc-400">PDF, VTT file, Website URL, or YouTube video link</p>
            </div>
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10 font-mono text-xs">
              <button
                onClick={() => setSourceType('file')}
                className={`flex-1 py-2 rounded-lg transition-all ${sourceType === 'file' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                Upload File (PDF/VTT)
              </button>
              <button
                onClick={() => setSourceType('url')}
                className={`flex-1 py-2 rounded-lg transition-all ${sourceType === 'url' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                Web / YouTube URL
              </button>
            </div>
            {sourceType === 'file' ? (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <FileUpload 
                  accept=".pdf,.vtt" 
                  onChange={(files: File[]) => setSelectedFile(files[0] || null)} 
                />

                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="w-full py-3 bg-white text-black font-mono text-xs font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-lg"
                >
                  {isUploading ? "Uploading & Parsing..." : "Add File Source"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddUrlSource} className="space-y-4">
                <div className="flex space-x-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setUrlKind('website')}
                    className={`flex-1 py-1.5 rounded-lg border border-white/10 ${urlKind === 'website' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    Website URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlKind('youtube')}
                    className={`flex-1 py-1.5 rounded-lg border border-white/10 ${urlKind === 'youtube' ? 'bg-white/20 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    YouTube Link
                  </button>
                </div>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder={urlKind === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://docs.contextai.dev'}
                  required
                  className="w-full bg-zinc-900 border border-white/15 text-white font-mono text-xs rounded-xl px-4 py-3 focus:border-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim() || isUploading}
                  className="w-full py-3 bg-white text-black font-mono text-xs font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-lg"
                >
                  {isUploading ? "Indexing URL..." : "Add URL Source"}
                </button>
              </form>
            )}
            {errorMsg && (
              <div className="text-rose-400 font-mono text-xs text-center">{errorMsg}</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
