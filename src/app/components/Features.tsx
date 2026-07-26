import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Globe, 
  Youtube, 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  Lock, 
  Check, 
  Play, 
  Pause,
  Layers,
  Box,
  Settings,
  Search
} from 'lucide-react';
import { GlowingEffect } from './ui/glowing-effect';

export const Features: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'web' | 'youtube'>('pdf');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto-cycling effect for features
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'pdf') return 'web';
        if (prev === 'web') return 'youtube';
        return 'pdf';
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleTabClick = (tab: 'pdf' | 'web' | 'youtube') => {
    setActiveTab(tab);
    setIsAutoPlaying(false);
  };

  return (
    <section id="features" className="py-28 px-6 md:px-12 relative z-10 border-t border-white/10 bg-black">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-zinc-400">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>AUTOMATED METRIC DEMO</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-mono font-bold text-white tracking-tight">
            Visual Architecture
          </h2>
          <p className="text-xs font-mono text-zinc-400">Hover over cards to trigger dynamic glowing edge proximity detection.</p>
        </div>

        {/* Visual Cards Grid with Aceternity GlowingEffect */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Multi-Format Processing with GlowingEffect */}
          <div className="relative rounded-3xl border border-white/10 p-1 md:p-2 group transition-all duration-300">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />

            <div className="relative z-10 glass-panel rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between h-full bg-[#050507] border-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-500 font-bold">// 01 INGESTION ENGINE</span>
                  <button 
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="text-[10px] font-mono bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {isAutoPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                    <span>{isAutoPlaying ? 'AUTO-CYCLING' : 'PAUSED'}</span>
                  </button>
                </div>
                <h3 className="text-2xl font-mono font-bold text-white">Multi-Format Processing</h3>
              </div>

              {/* Auto-cycling Visual Bar Chart */}
              <div className="bg-zinc-950/90 rounded-2xl p-5 border border-white/10 space-y-5">
                <div className="flex space-x-2 border-b border-white/10 pb-3">
                  <button
                    onClick={() => handleTabClick('pdf')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all ${
                      activeTab === 'pdf' ? 'bg-white text-black font-bold scale-105' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF Buffer</span>
                  </button>
                  <button
                    onClick={() => handleTabClick('web')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all ${
                      activeTab === 'web' ? 'bg-white text-black font-bold scale-105' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Web Docs</span>
                  </button>
                  <button
                    onClick={() => handleTabClick('youtube')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all ${
                      activeTab === 'youtube' ? 'bg-white text-black font-bold scale-105' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>YouTube</span>
                  </button>
                </div>

                <div className="w-full bg-zinc-900 h-0.5 rounded-full overflow-hidden">
                  <motion.div 
                    key={activeTab + 'timer'}
                    initial={{ width: '0%' }}
                    animate={{ width: isAutoPlaying ? '100%' : '0%' }}
                    transition={{ duration: 2.8, ease: 'linear' }}
                    className="bg-emerald-400 h-full"
                  />
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1 text-[11px]">
                      <span>Extraction Speed</span>
                      <span className="text-white font-bold">{activeTab === 'pdf' ? '12ms' : activeTab === 'web' ? '24ms' : '18ms'}</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        key={activeTab + 'speed'}
                        initial={{ width: 0 }}
                        animate={{ width: activeTab === 'pdf' ? '92%' : activeTab === 'web' ? '80%' : '88%' }}
                        transition={{ duration: 0.4 }}
                        className="bg-white h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1 text-[11px]">
                      <span>Semantic Density</span>
                      <span className="text-emerald-400 font-bold">{activeTab === 'pdf' ? '98.4%' : activeTab === 'web' ? '96.1%' : '94.8%'}</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        key={activeTab + 'density'}
                        initial={{ width: 0 }}
                        animate={{ width: activeTab === 'pdf' ? '98%' : activeTab === 'web' ? '96%' : '95%' }}
                        transition={{ duration: 0.4 }}
                        className="bg-emerald-400 h-full"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Card 2: HyDE Vector Expansion with GlowingEffect */}
          <div className="relative rounded-3xl border border-white/10 p-1 md:p-2 group transition-all duration-300">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />

            <div className="relative z-10 glass-panel rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between h-full bg-[#050507] border-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-500 font-bold">// 02 HYDE VECTOR EXPANSION</span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Accuracy Graph</span>
                </div>
                <h3 className="text-2xl font-mono font-bold text-white">HyDE Similarity vs Vanilla</h3>
              </div>

              <div className="bg-zinc-950/90 rounded-2xl p-5 border border-white/10 space-y-4">
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-500 mb-1">
                      <span>Standard Direct Search</span>
                      <span>61% Recall</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden">
                      <div className="bg-zinc-600 h-full w-[61%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-white font-bold mb-1">
                      <span className="flex items-center text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        HyDE Hypothetical Expansion
                      </span>
                      <span className="text-emerald-400">98% Precision</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-emerald-400 h-full w-[98%] shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] font-mono text-zinc-400 border-t border-white/10 flex justify-between">
                  <span>// Cosine distance similarity score</span>
                  <span className="text-white">1536 Dimensions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Vault Security Topology Diagram with GlowingEffect */}
          <div className="relative rounded-3xl border border-white/10 p-1 md:p-2 group transition-all duration-300">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />

            <div className="relative z-10 glass-panel rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between h-full bg-[#050507] border-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-500 font-bold">// 03 VAULT SECURITY DIAGRAM</span>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white">Isolation Topology</span>
                </div>
                <h3 className="text-2xl font-mono font-bold text-white">Clerk Namespace Isolation</h3>
              </div>

              <div className="bg-zinc-950/90 rounded-2xl p-5 border border-white/10 font-mono text-xs space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-zinc-900 rounded-xl border border-white/10 flex flex-col items-center justify-center">
                    <Lock className="w-4 h-4 text-white mb-1" />
                    <span className="text-[10px] text-zinc-400">Clerk Auth</span>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-emerald-400/30 flex flex-col items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] text-emerald-400 font-bold">Partition</span>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-white/10 flex flex-col items-center justify-center">
                    <Layers className="w-4 h-4 text-white mb-1" />
                    <span className="text-[10px] text-zinc-400">Pinecone</span>
                  </div>
                </div>
                <div className="text-[11px] text-center text-zinc-400 pt-1 border-t border-white/5">
                  Strict namespace isolation ensures zero cross-tenant data leakage.
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Grounded Output Matrix with GlowingEffect */}
          <div className="relative rounded-3xl border border-white/10 p-1 md:p-2 group transition-all duration-300">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />

            <div className="relative z-10 glass-panel rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between h-full bg-[#050507] border-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-500 font-bold">// 04 ZERO HALLUCINATION</span>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white">Confidence Matrix</span>
                </div>
                <h3 className="text-2xl font-mono font-bold text-white">Grounded Output Matrix</h3>
              </div>

              <div className="bg-zinc-950/90 rounded-2xl p-5 border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Response Verification</span>
                  <span className="text-emerald-400 font-bold flex items-center">
                    <Check className="w-3.5 h-3.5 mr-1" />
                    100% Grounded
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-6 bg-emerald-400/20 border border-emerald-400/40 rounded flex items-center justify-center text-[10px] text-emerald-300 font-bold">
                      C-{i}
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-zinc-500 pt-1">
                  Every token tied directly to retrieved source chunk IDs.
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
