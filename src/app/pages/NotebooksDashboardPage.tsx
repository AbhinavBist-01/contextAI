import React, { useState, useEffect } from "react";
import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import {
  Terminal,
  Plus,
  Search,
  Trash2,
  BookOpen,
  FolderPlus,
  ArrowRight,
  Layers,
  Sparkles,
  Calendar,
  FileText,
  X,
  Edit2,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Notebook {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  sourceCount: number;
  createdAt: string;
  updatedAt: string;
}

interface NotebooksDashboardPageProps {
  onSelectNotebook: (notebook: Notebook) => void;
  onBackToHome: () => void;
}

const COVER_PRESETS = [
  {
    name: "Emerald Aurora",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Obsidian Nebula",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Cyber Violet",
    url: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Deep Forest",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Cosmic Dusk",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60",
  },
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return "JUL 2026";
  try {
    const d = new Date(dateStr);
    return d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return "JUL 2026";
  }
}

export const NotebooksDashboardPage: React.FC<NotebooksDashboardPageProps> = ({
  onSelectNotebook,
  onBackToHome,
}) => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Notebook Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedCover, setSelectedCover] = useState(COVER_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Notebooks
  const fetchNotebooks = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/notebooks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNotebooks(data.notebooks || []);
      }
    } catch (err) {
      console.error("Failed to fetch notebooks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  // Handle Create Notebook
  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const token = await getToken();
      const res = await fetch("/notebooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTitle.trim(),
          description: newDescription.trim(),
          coverImage: selectedCover,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotebooks((prev) => [data.notebook, ...prev]);
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        // Automatically open the newly created notebook
        onSelectNotebook(data.notebook);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to create notebook");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error creating notebook");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Notebook
  const handleDeleteNotebook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this notebook and all its sources?",
      )
    )
      return;

    setDeletingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`/notebooks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setNotebooks((prev) => prev.filter((nb) => nb.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notebook:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered notebooks search
  const filteredNotebooks = notebooks.filter(
    (nb) =>
      nb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nb.description &&
        nb.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-white selection:text-black">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/10 px-6 md:px-12 py-4 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onBackToHome}>
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xl font-bold tracking-tight text-white">
              Context<span className="text-zinc-500">AI</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">
              Notebooks
            </span>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="flex-1 max-w-lg mx-6 md:mx-16">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121216] border border-white/15 focus:border-white/40 text-xs font-mono text-white placeholder-zinc-500 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Notebook</span>
          </button>

          <div className="pl-3 border-l border-white/10 flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Content ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tight flex items-center space-x-3.5">
              <span>Recent Notebooks</span>
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-zinc-300 border border-white/15 font-mono">
                {filteredNotebooks.length}
              </span>
            </h1>
            <p className="text-xs md:text-sm font-mono text-zinc-400">
              Select a notebook workspace or create a new isolated knowledge vault.
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-zinc-500 space-y-4 font-mono text-xs">
            <Loader2 className="w-7 h-7 animate-spin text-white" />
            <span>Loading your AI notebooks...</span>
          </div>
        ) : (
          /* Notebook Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            
            {/* Card 1: Add New Notebook Button Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="group cursor-pointer rounded-2xl bg-[#09090b] border-2 border-dashed border-white/15 hover:border-emerald-500/50 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[250px] transition-all hover:bg-emerald-500/[0.02] shadow-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center transition-all">
                <Plus className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  New Notebook
                </div>
                <div className="font-mono text-xs text-zinc-500 leading-relaxed max-w-[200px]">
                  Upload PDF, Web, VTT or YouTube sources
                </div>
              </div>
            </motion.div>

            {/* Notebook Cards */}
            <AnimatePresence>
              {filteredNotebooks.map((notebook) => (
                <motion.div
                  key={notebook.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -5 }}
                  onClick={() => onSelectNotebook(notebook)}
                  className="group relative cursor-pointer rounded-2xl bg-[#09090b] border border-white/15 hover:border-white/35 overflow-hidden flex flex-col justify-between shadow-xl transition-all hover:shadow-2xl min-h-[250px]"
                >
                  {/* Thumbnail / Cover Image */}
                  <div className="h-32 w-full relative overflow-hidden bg-zinc-900">
                    <img
                      src={notebook.coverImage || COVER_PRESETS[0].url}
                      alt={notebook.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />

                    {/* Delete button on cover */}
                    <button
                      onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                      disabled={deletingId === notebook.id}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md text-zinc-400 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete notebook"
                    >
                      {deletingId === notebook.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 md:p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div>
                      <h3 className="font-mono text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {notebook.name}
                      </h3>
                      {notebook.description && (
                        <p className="font-mono text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {notebook.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Metadata */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span className="flex items-center space-x-1.5 text-zinc-300">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{notebook.sourceCount || 0} sources</span>
                      </span>

                      <span className="flex items-center space-x-1.5 text-zinc-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(notebook.updatedAt || notebook.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Create Notebook Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#09090b] border border-white/20 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-6 right-6 p-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-mono font-bold text-white flex items-center space-x-2">
                  <FolderPlus className="w-5 h-5 text-emerald-400" />
                  <span>Create New Notebook</span>
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  Set up a title and visual preset for your new research vault.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                  {errorMsg}
                </div>
              )}

              <form
                onSubmit={handleCreateNotebook}
                className="space-y-5 font-mono text-xs"
              >
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-zinc-300 font-medium">
                    Notebook Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Quantum Computing Papers, Market Analysis 2026..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#121216] border border-white/20 text-white placeholder-zinc-500 rounded-xl p-3 focus:outline-none focus:border-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-zinc-300 font-medium">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the topics or sources in this notebook..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-[#121216] border border-white/20 text-white placeholder-zinc-500 rounded-xl p-3 focus:outline-none focus:border-white resize-none"
                  />
                </div>

                {/* Cover Preset Picker */}
                <div className="space-y-2">
                  <label className="text-zinc-300 font-medium">
                    Select Cover Artwork
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {COVER_PRESETS.map((preset) => (
                      <div
                        key={preset.name}
                        onClick={() => setSelectedCover(preset.url)}
                        className={`h-14 rounded-xl relative cursor-pointer overflow-hidden border-2 transition-all ${
                          selectedCover === preset.url
                            ? "border-emerald-400 ring-2 ring-emerald-400/20 scale-105"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                        {selectedCover === preset.url && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/20 text-zinc-300 hover:text-white hover:border-white/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim()}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Create & Open</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
