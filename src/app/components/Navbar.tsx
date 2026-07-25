import React from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Terminal, ArrowRight, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  onNavigateToLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateToLogin }) => {
  const { user } = useUser();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openWorkspace = () => {
    window.location.hash = '#workspace';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass-nav rounded-2xl px-5 py-3 shadow-2xl">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-white shadow-inner">
            <Terminal className="w-4 h-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-mono tracking-tight font-bold text-lg text-white">Context<span className="text-zinc-400">AI</span></span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white/10 text-zinc-300 rounded border border-white/15">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Center: Glassmorphic Nav Buttons */}
        <nav className="hidden md:flex items-center space-x-1 bg-white/[0.03] p-1 rounded-full border border-white/10">
          <button 
            onClick={() => scrollToSection('features')} 
            className="px-4 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          >
            // features
          </button>
          <button 
            onClick={() => scrollToSection('pipeline')} 
            className="px-4 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          >
            // pipeline
          </button>
          <button 
            onClick={() => scrollToSection('architecture')} 
            className="px-4 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          >
            // architecture
          </button>
          <button 
            onClick={() => scrollToSection('docs')} 
            className="px-4 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          >
            // docs
          </button>
        </nav>

        {/* Right: Clerk Sign In / User Profile */}
        <div className="flex items-center space-x-3">
          <SignedOut>
            <button 
              onClick={onNavigateToLogin}
              className="group relative inline-flex items-center justify-center px-4 py-2 text-xs font-mono font-medium tracking-wide text-black bg-white rounded-xl hover:bg-zinc-200 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </SignedOut>

          <SignedIn>
            <button
              onClick={openWorkspace}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>

            <div className="flex items-center space-x-3 bg-white/5 border border-white/10 py-1 px-3 rounded-xl">
              <div className="text-right hidden md:block">
                <div className="text-xs font-mono text-white font-semibold">{user?.firstName || user?.username || 'Developer'}</div>
                <div className="text-[10px] font-mono text-emerald-400">Vault Active</div>
              </div>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 rounded-lg border border-white/20'
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>

      </div>
    </header>
  );
};
