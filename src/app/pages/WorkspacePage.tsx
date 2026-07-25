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
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
  User,
  Zap,
  Info
} from 'lucide-react';

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
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onBackToHome }) => {
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
  const [notebookTitle, setNotebookTitle] = useState('My AI Knowledge Base');
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const token = await getToken();
      const res = await fetch('/api/rag/sources', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = await getToken();
      const res = await fetch('/api/rag/query/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchSources();
    fetchHistory();
  }, []);

  // Poll indexing sources every 3 seconds if any source is in "indexing" state
  useEffect(() => {
    const hasIndexing = sources.some(s => s.status === 'indexing');
    if (!hasIndexing) return;

    const timer = setInterval(() => {
      fetchSources();
    }, 3000);

    return () => clearInterval(timer);
  }, [sources]);

  // Handle URL Source Upload
  const handleAddUrlSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setErrorMsg(null);
    setIsUploading(true);

    try {
      const token = await getToken();
      const res = await fetch('/api/rag/sources/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          url: urlInput,
          type: urlKind
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
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/rag/sources/file', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
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
      const token = await getToken();
      const res = await fetch(`/api/rag/sources/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
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
      const token = await getToken();
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessageText })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        usedRAG: data.usedRAG
      };

      setMessages(prev => [...prev, assistantMsg]);
      setRequestCount(prev => prev + 1);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate response');
    } finally {
      setIsLoadingQuery(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans flex flex-col selection:bg-white selection:text-black">
      
      {/* ── TOP NAVBAR ────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-white/10 bg-[#08080a] px-4 md:px-8 flex items-center justify-between z-30 sticky top-0">
        
        {/* Left: Workspace Title */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-white text-sm">{notebookTitle}</span>
                <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-300 border border-white/10">
                  NotebookLM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Request Counter & User Account Badge */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1 rounded-xl font-mono text-xs text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{requestCount}/10 Queries Today</span>
          </div>

          <div className="flex items-center space-x-3 pl-2 border-l border-white/10">
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

      {/* ── MAIN WORKSPACE BODY ────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ── SIDEBAR (SOURCES MANAGEMENT) ────────────────────────────── */}
        <aside className="w-72 md:w-80 border-r border-white/10 bg-[#050507] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          
          <div className="space-y-5">
            
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-white" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">Sources</span>
                <span className="font-mono text-[11px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full">
                  {sources.length}/5
                </span>
              </div>
              
              {sources.length < 5 && (
                <button
                  onClick={() => setIsAddingSource(true)}
                  className="p-1.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  title="Add Source"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sources List */}
            {sources.length === 0 ? (
              <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center space-y-3">
                <Info className="w-6 h-6 text-zinc-500 mx-auto" />
                <div className="font-mono text-xs text-zinc-400">No sources added yet</div>
                <button
                  onClick={() => setIsAddingSource(true)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-mono text-white border border-white/15 transition-all w-full cursor-pointer"
                >
                  + Add PDF, Web or YouTube
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sources.map(s => {
                  const isIndexing = s.status === 'indexing';
                  const isIndexed = s.status === 'indexed';

                  return (
                    <div 
                      key={s.id}
                      className="group relative bg-[#0b0b0e] border border-white/10 hover:border-white/30 rounded-2xl p-3.5 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        
                        {/* Type Icon */}
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          {s.type === 'pdf' && <FileText className="w-3.5 h-3.5 text-rose-400" />}
                          {s.type === 'vtt' && <FileText className="w-3.5 h-3.5 text-amber-400" />}
                          {s.type === 'website' && <Globe className="w-3.5 h-3.5 text-blue-400" />}
                          {s.type === 'youtube' && <Youtube className="w-3.5 h-3.5 text-red-500" />}
                        </div>

                        {/* Title & Hover Badge */}
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-xs text-white truncate font-medium">{s.name}</div>
                          
                          {/* Hover Tooltip / Status indicator */}
                          <div className="flex items-center space-x-1.5 pt-0.5">
                            {isIndexing && (
                              <span className="flex items-center text-[10px] font-mono text-amber-400">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1" />
                                <span className="group-hover:inline hidden">File is indexing</span>
                                <span className="group-hover:hidden inline">Indexing...</span>
                              </span>
                            )}
                            {isIndexed && (
                              <span className="flex items-center text-[10px] font-mono text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1" />
                                <span className="group-hover:inline hidden">File indexed</span>
                                <span className="group-hover:hidden inline">Indexed</span>
                              </span>
                            )}
                            {s.status === 'failed' && (
                              <span className="flex items-center text-[10px] font-mono text-rose-400">
                                <span className="w-2 h-2 rounded-full bg-rose-500 mr-1" />
                                Indexing failed
                              </span>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Delete Action */}
                      <button
                        onClick={() => handleDeleteSource(s.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0"
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

          {/* Sidebar Footer Info */}
          <div className="pt-4 border-t border-white/10 text-[10px] font-mono text-zinc-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>RAG Mode:</span>
              <span className="text-emerald-400 font-bold">HyDE Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Quota:</span>
              <span>Max 5 Sources</span>
            </div>
          </div>

        </aside>

        {/* ── CHAT MAIN INTERFACE (CHATGPT / NOTEBOOKLM STYLE) ──────────── */}
        <section className="flex-1 flex flex-col bg-[#030303] relative overflow-hidden">
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
            
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-12">
                <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-mono font-bold text-white">Ask Anything About Your Sources</h3>
                <p className="text-xs font-mono text-zinc-400 max-w-md">
                  Upload PDFs, Web Docs, or YouTube links in the sidebar to perform HyDE vector search and get zero-hallucination grounded responses.
                </p>

                {/* Quick Prompt Ideas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full pt-4 font-mono text-xs">
                  <button 
                    onClick={() => setInputQuery("Summarize the key findings from my uploaded documents.")}
                    className="p-3 bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-left text-zinc-300 hover:text-white transition-all"
                  >
                    💡 "Summarize the key findings from my sources..."
                  </button>
                  <button 
                    onClick={() => setInputQuery("What are the architectural steps in HyDE expansion?")}
                    className="p-3 bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-left text-zinc-300 hover:text-white transition-all"
                  >
                    🔍 "Explain the HyDE vector expansion steps..."
                  </button>
                </div>
              </div>
            ) : (
              messages.map(m => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUser ? 'bg-white text-black' : 'bg-white/10 text-white border border-white/20'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-400" />}
                    </div>

                    {/* Message Card */}
                    <div className={`max-w-2xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl font-sans text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-white text-black font-medium shadow-md' 
                          : 'glass-panel text-zinc-200 border border-white/10'
                      }`}>
                        {m.content}
                      </div>

                      {/* Sources Cited Accordion/Cards */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="bg-zinc-950/90 border border-white/10 rounded-xl p-3.5 space-y-2 font-mono text-xs">
                          <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>SOURCES CITED ({m.citations.length})</span>
                          </div>

                          <div className="space-y-2 pt-1">
                            {m.citations.map((c, idx) => (
                              <div key={idx} className="bg-white/5 p-2.5 rounded-lg border border-white/10 space-y-1">
                                <div className="flex items-center justify-between text-white font-bold text-[11px]">
                                  <span>{c.sourceName}</span>
                                  <span className="text-[10px] text-zinc-500 uppercase">{c.sourceType}</span>
                                </div>
                                <p className="text-zinc-400 text-[11px] line-clamp-2 italic">
                                  "{c.text}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            )}

            {/* Loading Indicator */}
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

          {/* ── CHAT INPUT FORM ────────────────────────────────────────── */}
          <div className="p-4 md:p-6 border-t border-white/10 bg-[#050507]">
            <form onSubmit={handleSendQuery} className="max-w-4xl mx-auto flex items-center space-x-3">
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder={sources.length > 0 ? "Ask anything about your uploaded sources..." : "Ask AI directly (or add sources in sidebar)..."}
                disabled={isLoadingQuery}
                className="flex-1 bg-zinc-900 border border-white/15 text-white font-mono text-xs rounded-2xl px-5 py-4 focus:border-white focus:outline-none placeholder-zinc-500 transition-all"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoadingQuery}
                className="p-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {errorMsg && (
              <div className="max-w-4xl mx-auto mt-2 text-rose-400 font-mono text-xs flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

        </section>

      </div>

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

            {/* Source Type Switcher */}
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
                <div className="border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl p-6 text-center space-y-3 bg-zinc-950">
                  <Upload className="w-8 h-8 text-zinc-400 mx-auto" />
                  <div className="font-mono text-xs text-zinc-300">
                    {selectedFile ? selectedFile.name : "Select PDF or VTT document"}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.vtt"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-mono text-white cursor-pointer border border-white/15"
                  >
                    Browse Files
                  </label>
                </div>

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
