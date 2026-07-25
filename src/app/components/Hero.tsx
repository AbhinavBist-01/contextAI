import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { ArrowRight, Cpu, Sparkles, ShieldCheck, Activity, Database } from 'lucide-react';

interface HeroProps {
  onNavigateToLogin: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigateToLogin }) => {
  const { user } = useUser();

  return (
    <section className="relative min-h-[90vh] pt-36 pb-24 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden bg-grid-pattern">
      {/* Glow Ambient Backdrops */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center z-10 space-y-10">
        
        {/* Minimal Monospaced Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wider uppercase">HYDE VECTOR RAG ENGINE</span>
        </motion.div>

        {/* Hero Title & Minimal Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-white font-mono leading-none">
            Context<span className="text-zinc-600">AI</span>
          </h1>
          <p className="text-lg md:text-2xl text-zinc-300 font-sans font-light max-w-2xl mx-auto tracking-tight">
            Minimal, zero-hallucination vector knowledge base powered by HyDE query expansion.
          </p>
        </motion.div>

        {/* Minimal CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-2"
        >
          <SignedOut>
            <button
              onClick={onNavigateToLogin}
              className="group px-8 py-4 text-xs font-mono font-bold tracking-widest text-black bg-white rounded-2xl shadow-[0_0_35px_rgba(255,255,255,0.2)] hover:bg-zinc-200 transition-all duration-200 flex items-center justify-center w-full sm:w-auto cursor-pointer"
            >
              <span>GET STARTED</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </SignedOut>

          <SignedIn>
            <a href="#pipeline" className="group px-8 py-4 text-xs font-mono font-bold tracking-widest text-black bg-white rounded-2xl shadow-[0_0_35px_rgba(255,255,255,0.2)] hover:bg-zinc-200 transition-all duration-200 flex items-center justify-center w-full sm:w-auto">
              <ShieldCheck className="w-4 h-4 mr-2 text-black" />
              <span>LAUNCH VAULT ({user?.firstName || 'User'})</span>
            </a>
          </SignedIn>

          <a href="#pipeline" className="px-7 py-4 text-xs font-mono text-zinc-300 rounded-2xl flex items-center justify-center w-full sm:w-auto border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all">
            <Cpu className="w-4 h-4 mr-2 text-zinc-400" />
            <span>VIEW DIAGRAM</span>
          </a>
        </motion.div>

        {/* VISUAL ARCHITECTURE DASHBOARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-8 max-w-5xl mx-auto"
        >
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/15 shadow-2xl text-left space-y-6">
            
            {/* Visual Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-mono text-xs text-white font-bold tracking-wider">LIVE SYSTEM MATRIX</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                1536D Pinecone Vectors
              </span>
            </div>

            {/* 3 Visual Live Flow Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              
              {/* Node 1 */}
              <div className="bg-black/80 rounded-2xl p-4 border border-white/10 space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px] text-zinc-500 font-bold">NODE 01</span>
                  <span className="text-emerald-400 text-[10px]">INGEST</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white font-bold">Multi-Parser</div>
                    <div className="text-[10px] text-zinc-500">PDF, Web, YouTube</div>
                  </div>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-white h-full w-[85%] animate-pulse" />
                </div>
              </div>

              {/* Node 2 */}
              <div className="bg-black/80 rounded-2xl p-4 border border-white/10 space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px] text-zinc-500 font-bold">NODE 02</span>
                  <span className="text-emerald-400 text-[10px]">EXPAND</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white font-bold">HyDE Engine</div>
                    <div className="text-[10px] text-zinc-500">Synthetic Embeddings</div>
                  </div>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[98%]" />
                </div>
              </div>

              {/* Node 3 */}
              <div className="bg-black/80 rounded-2xl p-4 border border-white/10 space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px] text-zinc-500 font-bold">NODE 03</span>
                  <span className="text-emerald-400 text-[10px]">OUTPUT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-white font-bold">Grounded AI</div>
                    <div className="text-[10px] text-zinc-500">Zero Hallucination</div>
                  </div>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-white h-full w-[100%]" />
                </div>
              </div>

            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};
