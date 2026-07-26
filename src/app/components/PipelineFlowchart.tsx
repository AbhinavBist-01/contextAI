import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Globe, 
  Youtube, 
  Scissors, 
  Database, 
  Sparkles, 
  Bot, 
  CheckCircle2,
  Cpu,
  Layers,
  Search,
  Zap,
  ArrowRight,
  Code,
  Sliders,
  Check,
  ChevronDown
} from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'input' | 'process' | 'decision' | 'database' | 'output';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  stepNumber: string;
  badge: string;
  badgeColor: string;
  inputFrom?: string[];
  description: string;
  technicalDetails: {
    label: string;
    value: string;
  }[];
  codeSnippet: string;
}

export const PipelineFlowchart: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string>('node-hyde');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const nodes: FlowNode[] = [
    {
      id: 'node-sources',
      type: 'input',
      title: 'Raw Data Ingestion',
      subtitle: 'Multi-Format Sources',
      icon: <Layers className="w-5 h-5 text-zinc-200" />,
      stepNumber: '01',
      badge: 'INPUT',
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
      description: 'Ingests raw documents from PDF files, web pages, and YouTube video transcripts into raw buffer memory.',
      technicalDetails: [
        { label: 'PDF Engine', value: 'pdf-parse v2 (page-load iterator)' },
        { label: 'Web Scraper', value: 'Cheerio HTML DOM parser' },
        { label: 'YT Engine', value: 'YoutubeTranscript API' }
      ],
      codeSnippet: `const pdf = await parsePDF(buffer);\nconst web = await parseWeb(url);\nconst yt  = await parseYouTube(ytUrl);`
    },
    {
      id: 'node-chunker',
      type: 'process',
      title: 'Sliding Window Chunker',
      subtitle: '500 Chars / 50 Overlap',
      icon: <Scissors className="w-5 h-5 text-amber-400" />,
      stepNumber: '02',
      badge: 'PROCESS',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      inputFrom: ['node-sources'],
      description: 'Splits text into uniform overlapping chunks with regex paragraph boundary checks and page hint metadata.',
      technicalDetails: [
        { label: 'Window Size', value: '500 characters' },
        { label: 'Overlap', value: '50 characters' },
        { label: 'Marker Filter', value: 'Strips page numbers & header artifacts' }
      ],
      codeSnippet: `const chunks = chunkPDF({\n  text: cleanText,\n  fileName: 'document.pdf'\n});`
    },
    {
      id: 'node-embed',
      type: 'process',
      title: 'OpenAI Embedder',
      subtitle: '1536-Dim Vectors',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      stepNumber: '03',
      badge: 'VECTORIZE',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      inputFrom: ['node-chunker'],
      description: 'Converts textual chunks into 1536-dimensional dense vector embeddings via text-embedding-3-small.',
      technicalDetails: [
        { label: 'Model', value: 'text-embedding-3-small' },
        { label: 'Dimensions', value: '1536 floats' },
        { label: 'Batch Size', value: '100 chunks per request' }
      ],
      codeSnippet: `const response = await openai.embeddings.create({\n  model: 'text-embedding-3-small',\n  input: chunkText\n});`
    },
    {
      id: 'node-pinecone',
      type: 'database',
      title: 'Pinecone Vector Index',
      subtitle: 'Cosine Similarity Search',
      icon: <Database className="w-5 h-5 text-purple-400" />,
      stepNumber: '04',
      badge: 'INDEX',
      badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
      inputFrom: ['node-embed'],
      description: 'Persists dense vectors into Pinecone serverless index grouped by user workspace namespace.',
      technicalDetails: [
        { label: 'Metric', value: 'Cosine Similarity' },
        { label: 'Namespace', value: 'user_vault_<clerk_id>' },
        { label: 'Top-K Retrieval', value: '5 nearest neighbors' }
      ],
      codeSnippet: `await index.namespace(userId).upsert(vectors);`
    },
    {
      id: 'node-hyde',
      type: 'decision',
      title: 'HyDE Query Expansion',
      subtitle: 'Hypothetical Document Synthesis',
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      stepNumber: '05',
      badge: 'AI SYNTHESIS',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
      description: 'Synthesizes a hypothetical answer first before vector lookup, boosting retrieval accuracy by up to +98%.',
      technicalDetails: [
        { label: 'Strategy', value: 'Hypothetical Document Embeddings' },
        { label: 'LLM Generator', value: 'gpt-4o-mini' },
        { label: 'Similarity Goal', value: 'Align query with target document manifold' }
      ],
      codeSnippet: `const hydeDoc = await generateHyDE(userQuery);\nconst queryVector = await embed(hydeDoc);`
    },
    {
      id: 'node-rag-llm',
      type: 'output',
      title: 'Grounded RAG Output',
      subtitle: 'Zero-Hallucination Generator',
      icon: <Bot className="w-5 h-5 text-emerald-400" />,
      stepNumber: '06',
      badge: 'OUTPUT',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      inputFrom: ['node-pinecone', 'node-hyde'],
      description: 'Constructs strict system prompt enforcing citations and returns grounded answers with exact source references.',
      technicalDetails: [
        { label: 'Groundedness', value: '100% strict context enforcement' },
        { label: 'Citations', value: 'Source name, timestamps & page numbers' },
        { label: 'Rate Limiter', value: '10 queries / day per user' }
      ],
      codeSnippet: `const answer = await generateGroundedAnswer({\n  query: userQuery,\n  contexts: matchingChunks\n});`
    }
  ];

  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[4];

  return (
    <section id="pipeline" className="py-28 px-4 md:px-12 relative z-10 border-t border-white/10 bg-[#030304]">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>INTERACTIVE ARCHITECTURE FLOWCHART</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-mono font-bold text-white tracking-tight">
            RAG Pipeline Flowchart
          </h2>
          <p className="text-xs font-mono text-zinc-400">
            Click any node below to inspect data payloads, transformation algorithms, and execution logic.
          </p>
        </div>

        {/* ── GRAPHICAL FLOWCHART DIAGRAM CANVAS ─────────────────────── */}
        <div className="glass-panel p-6 md:p-10 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden bg-[#070709]">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative z-10 space-y-12">
            
            {/* Top Flowchart Track: Nodes Sequence */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
              
              {nodes.map((node, index) => {
                const isActive = node.id === activeNodeId;
                const isHovered = node.id === hoveredNodeId;

                return (
                  <div key={node.id} className="relative flex flex-col items-center">
                    
                    {/* Flowchart Node Card Shape */}
                    <motion.div
                      onClick={() => setActiveNodeId(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full cursor-pointer rounded-2xl p-4 border transition-all duration-300 relative flex flex-col justify-between h-44 ${
                        isActive 
                          ? 'bg-zinc-900 border-emerald-400 text-white shadow-[0_0_30px_rgba(52,211,153,0.2)] ring-1 ring-emerald-400/50' 
                          : isHovered 
                          ? 'bg-zinc-900/90 border-white/40 text-white'
                          : 'bg-zinc-950/80 border-white/10 text-zinc-400 hover:border-white/25'
                      }`}
                    >
                      {/* Top Header Badge & Step */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-zinc-500">
                          {node.stepNumber}
                        </span>

                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${node.badgeColor}`}>
                          {node.badge}
                        </span>
                      </div>

                      {/* Node Icon & Title */}
                      <div className="space-y-2 my-auto">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          isActive 
                            ? 'bg-emerald-400 text-black border-emerald-300' 
                            : 'bg-white/5 border-white/10 text-white'
                        }`}>
                          {node.icon}
                        </div>

                        <div>
                          <h4 className="font-mono font-bold text-xs text-white leading-snug">{node.title}</h4>
                          <p className="font-mono text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{node.subtitle}</p>
                        </div>
                      </div>

                      {/* Bottom Status Line */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{isActive ? 'INSPECTING' : 'CLICK TO VIEW'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isActive ? 'rotate-180 text-emerald-400' : ''}`} />
                      </div>
                    </motion.div>

                    {/* Horizontal Connecting Flow Arrow (Desktop) */}
                    {index < nodes.length - 1 && (
                      <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-zinc-400 shadow-md">
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}

            </div>

            {/* ── SELECTED NODE DETAILED INSPECTOR PANEL ───────────────── */}
            {activeNode && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeNode.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-black/90 rounded-3xl p-6 md:p-8 border border-white/15 space-y-6 shadow-2xl"
                >
                
                {/* Node Inspector Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                      {activeNode.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-emerald-400 font-bold">NODE {activeNode.stepNumber}</span>
                        <span className="text-zinc-600">•</span>
                        <h3 className="font-mono font-bold text-base text-white">{activeNode.title}</h3>
                      </div>
                      <p className="font-mono text-xs text-zinc-400 pt-0.5">{activeNode.description}</p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${activeNode.badgeColor}`}>
                    {activeNode.badge}
                  </span>
                </div>

                {/* Grid: Technical Specifications & Code Snippet */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Technical Parameters List */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pipeline Specifications</span>
                    </div>

                    <div className="space-y-2">
                      {activeNode.technicalDetails.map((detail, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-xs">
                          <span className="text-zinc-400">{detail.label}</span>
                          <span className="text-white font-bold">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Code Logic Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
                      <Code className="w-3.5 h-3.5 text-blue-400" />
                      <span>Execution Routine</span>
                    </div>

                    <div className="bg-[#050507] border border-white/10 rounded-xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto">
                      <pre className="whitespace-pre-wrap leading-relaxed">{activeNode.codeSnippet}</pre>
                    </div>
                  </div>

                </div>

              </motion.div>
            </AnimatePresence>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
