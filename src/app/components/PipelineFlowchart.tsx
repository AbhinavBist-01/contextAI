import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCode2, 
  Scissors, 
  Database, 
  Sparkles, 
  Bot, 
  ArrowRight, 
  ChevronRight,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface Stage {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  graphicalWidget: React.ReactNode;
}

export const PipelineFlowchart: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string>('stage-3');

  const stages: Stage[] = [
    {
      id: 'stage-1',
      number: '01',
      title: 'Source Ingestion',
      subtitle: 'PDF, Web & YouTube',
      icon: <FileCode2 className="w-5 h-5 text-white" />,
      graphicalWidget: (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Cheerio / pdf-parse / youtubei.js</span>
            <span className="text-emerald-400">Parsed</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg">PDF Buffer</div>
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg">HTML DOM</div>
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg">Transcript</div>
          </div>
        </div>
      )
    },
    {
      id: 'stage-2',
      number: '02',
      title: 'Chunking Engine',
      subtitle: '500 Chars / 50 Overlap',
      icon: <Scissors className="w-5 h-5 text-white" />,
      graphicalWidget: (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Recursive Windowing</span>
            <span className="text-emerald-400">500 Chars</span>
          </div>
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <div className="h-6 bg-white/10 border border-white/20 rounded px-2 flex items-center text-[10px]">Chunk #1</div>
            <div className="h-6 bg-emerald-400/20 border border-emerald-400/40 rounded px-2 flex items-center text-[10px] text-emerald-300">Overlap</div>
            <div className="h-6 bg-white/10 border border-white/20 rounded px-2 flex items-center text-[10px]">Chunk #2</div>
          </div>
        </div>
      )
    },
    {
      id: 'stage-3',
      number: '03',
      title: 'Pinecone Vector DB',
      subtitle: '1536D Embeddings',
      icon: <Database className="w-5 h-5 text-white" />,
      graphicalWidget: (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>OpenAI text-embedding-3-small</span>
            <span className="text-emerald-400">1536 Dimensions</span>
          </div>
          <div className="grid grid-cols-6 gap-1 h-7 items-center">
            {[0.12, 0.94, -0.45, 0.78, 0.31, 0.88].map((v, idx) => (
              <div key={idx} className="bg-zinc-800 border border-white/10 rounded h-full flex items-center justify-center text-[9px] text-zinc-300">
                {v}
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'stage-4',
      number: '04',
      title: 'HyDE Expansion',
      subtitle: 'Hypothetical Document',
      icon: <Sparkles className="w-5 h-5 text-white" />,
      graphicalWidget: (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Synthesize Answer First</span>
            <span className="text-emerald-400">Recall +98%</span>
          </div>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300">
            HyDE hypothetical doc matches vector cluster with pinpoint similarity.
          </div>
        </div>
      )
    },
    {
      id: 'stage-5',
      number: '05',
      title: 'Grounded Output',
      subtitle: 'Zero Hallucination',
      icon: <Bot className="w-5 h-5 text-white" />,
      graphicalWidget: (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Strict System Prompt</span>
            <span className="text-emerald-400 font-bold">100% Grounded</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400 text-[11px]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Response generated exclusively using matching source chunks.</span>
          </div>
        </div>
      )
    }
  ];

  const currentStage = stages.find(s => s.id === selectedStage) || stages[2];

  return (
    <section id="pipeline" className="py-32 px-6 md:px-12 relative z-10 border-t border-white/10 bg-[#040405]">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-white" />
            <span>GRAPHICAL PIPELINE FLOW</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-mono font-bold text-white tracking-tight">
            Data Flowchart
          </h2>
        </div>

        {/* Visual Horizontal Flowchart Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 relative">
          
          {stages.map((stage, idx) => {
            const isSelected = stage.id === selectedStage;
            return (
              <div key={stage.id} className="relative">
                <motion.div
                  onClick={() => setSelectedStage(stage.id)}
                  whileHover={{ scale: 1.02 }}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full ${
                    isSelected 
                      ? 'bg-zinc-900 border-white text-white shadow-[0_0_35px_rgba(255,255,255,0.15)] ring-1 ring-white/50' 
                      : 'bg-zinc-950/80 border-white/10 text-zinc-400 hover:border-white/30 hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="space-y-4 z-10">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-500 font-bold">{stage.number}</span>
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-white text-black' : 'bg-white/5 text-white'}`}>
                        {stage.icon}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono font-bold text-sm text-white">{stage.title}</h4>
                      <p className="font-mono text-[11px] text-zinc-400 mt-1">{stage.subtitle}</p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center text-[11px] font-mono text-zinc-500 justify-between z-10 border-t border-white/5 mt-4">
                    <span>{isSelected ? 'SELECTED' : 'INSPECT'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-white' : ''}`} />
                  </div>
                </motion.div>

                {/* Animated Connection Arrow (hidden on last item and mobile) */}
                {idx < stages.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-white">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* Selected Stage Detail Visual Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="glass-panel rounded-3xl p-8 border border-white/15 shadow-2xl max-w-4xl mx-auto space-y-6 text-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded-md bg-white text-black font-mono text-xs font-bold">
                  STAGE {currentStage.number}
                </span>
                <span className="font-mono text-sm text-white font-bold tracking-tight">
                  {currentStage.title}
                </span>
              </div>
              <span className="font-mono text-xs text-zinc-500 uppercase">{currentStage.subtitle}</span>
            </div>

            {/* Stage Visual Graphical Widget */}
            <div className="bg-black/90 rounded-2xl p-6 border border-white/10">
              {currentStage.graphicalWidget}
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
