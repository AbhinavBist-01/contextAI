import React from 'react';
import { SignIn, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Terminal, ArrowLeft, ShieldCheck, Database, Sparkles, CheckCircle2, Lock } from 'lucide-react';

interface LoginPageProps {
  onBackToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome }) => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-grid-pattern">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-white/[0.03] rounded-full blur-[150px] pointer-events-none" />

      {/* Top Floating Back Button */}
      <button 
        onClick={onBackToHome}
        className="fixed top-6 left-6 md:top-8 md:left-8 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#09090b] border border-white/20 text-xs font-mono text-zinc-200 hover:text-white hover:border-white/40 transition-all z-50 cursor-pointer shadow-2xl"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
        <span>BACK TO CONTEXTAI</span>
      </button>

      {/* Main Container Card */}
      <div className="w-full max-w-5xl z-10 bg-[#09090b] rounded-3xl border border-white/20 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Column: Visual Agentic Showcase */}
        <div className="lg:col-span-5 bg-[#050507] p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-white/15 flex flex-col justify-between space-y-8 relative">
          
          <div className="space-y-4 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono text-xl font-bold tracking-tight text-white">Context<span className="text-zinc-500">AI</span></span>
                <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15">v1.0</span>
              </div>
            </div>
            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              [ Isolated Vector Vault & HyDE RAG Engine ]
            </p>
          </div>

          {/* System Metrics Cards */}
          <div className="space-y-3 z-10 font-mono text-xs">
            <div className="bg-[#0b0b0e] rounded-2xl p-4 border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center text-white font-bold">
                  <Database className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                  <span>Pinecone Vault</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">ISOLATED</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Per-user vector namespace isolation mapped to Clerk auth ID.
              </div>
            </div>

            <div className="bg-[#0b0b0e] rounded-2xl p-4 border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center text-white font-bold">
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-white" />
                  <span>HyDE Expansion</span>
                </span>
                <span className="text-[10px] text-white font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">98% RECALL</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Hypothetical embedding generation hits vector space with accuracy.
              </div>
            </div>
          </div>

          {/* Footer Security Note */}
          <div className="pt-4 border-t border-white/15 flex items-center justify-between text-[11px] font-mono text-zinc-400 z-10">
            <span className="flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <span>Clerk Auth Session</span>
            </span>
            <span>256-Bit SSL</span>
          </div>

        </div>

        {/* Right Column: Custom Dark Clerk Sign In Panel */}
        <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center items-center bg-[#09090b] relative">
          
          <div className="w-full max-w-md space-y-5">
            
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-mono font-bold text-white tracking-tight">
                Developer Authentication
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Sign in or register to launch your vector knowledge vault.
              </p>
            </div>

            {/* Clerk Component */}
            <div className="w-full flex justify-center py-2">
              <SignedOut>
                <SignIn 
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      card: 'bg-[#09090b] border-0 shadow-none p-0 w-full text-white',
                      headerTitle: 'text-white font-mono text-lg font-bold',
                      headerSubtitle: 'text-zinc-400 font-mono text-xs',
                      socialButtonsBlockButton: 'bg-[#121216] border border-white/20 text-white hover:bg-[#1a1a22] font-mono text-xs rounded-xl py-2.5',
                      socialButtonsBlockButtonText: 'font-mono text-xs text-white font-medium',
                      dividerLine: 'bg-white/15',
                      dividerText: 'text-zinc-500 font-mono text-[10px]',
                      formButtonPrimary: 'bg-white text-black font-mono text-xs font-bold hover:bg-zinc-200 rounded-xl py-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]',
                      formFieldLabel: 'text-zinc-200 font-mono text-xs font-medium',
                      formFieldInput: 'bg-[#121216] border border-white/25 text-white placeholder-zinc-400 font-mono text-xs rounded-xl py-2.5 px-3 focus:border-white focus:ring-1 focus:ring-white',
                      footerActionLink: 'text-white hover:underline font-mono text-xs font-bold',
                      footerActionText: 'text-zinc-400 font-mono text-xs'
                    }
                  }}
                />
              </SignedOut>

              <SignedIn>
                <div className="w-full bg-[#0d0d10] border border-white/20 rounded-2xl p-8 text-center space-y-6 font-mono text-xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg text-white font-bold">Session Authenticated</div>
                    <div className="text-zinc-400">Connected as <span className="text-white font-bold">{user?.primaryEmailAddress?.emailAddress || user?.username}</span></div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/15 text-emerald-400 text-xs">
                    Vector Partition: pinecone_usr_{user?.id?.slice(-6)} Active
                  </div>
                  <button 
                    onClick={onBackToHome}
                    className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
                  >
                    ENTER DASHBOARD
                  </button>
                </div>
              </SignedIn>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
