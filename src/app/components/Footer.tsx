import React from 'react';
import { Terminal, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="docs" className="py-16 px-4 md:px-8 border-t border-white/10 bg-[#020203] text-zinc-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left: Branding & Status */}
        <div className="flex flex-col space-y-3 items-center md:items-start text-center md:text-left">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">ContextAI</span>
          </div>
          <p className="text-zinc-500 text-xs max-w-sm">
            Minimal agentic vector knowledge engine. Multi-source parsing, HyDE expansion, zero hallucination response generation.
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Systems Operational — 100% Vector Uptime</span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex flex-wrap justify-center gap-6 text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors flex items-center">
            <span>Features</span>
          </a>
          <a href="#pipeline" className="hover:text-white transition-colors flex items-center">
            <span>Pipeline</span>
          </a>
          <a href="#architecture" className="hover:text-white transition-colors flex items-center">
            <span>HyDE Spec</span>
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center">
            <span>GitHub</span>
            <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </a>
        </div>

        {/* Right: Copyright */}
        <div className="text-zinc-600 text-[11px] text-center md:text-right">
          <div>© {new Date().getFullYear()} ContextAI. All rights reserved.</div>
          <div className="mt-1 text-zinc-500">Built with React, Vite & Tailwind CSS</div>
        </div>

      </div>
    </footer>
  );
};
