import React, { useState, useEffect } from 'react';
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { PipelineFlowchart } from './components/PipelineFlowchart';
import { Footer } from './components/Footer';
import { LoginPage } from './pages/LoginPage';
import { WorkspacePage } from './pages/WorkspacePage';

export function App() {
  const { isSignedIn, isLoaded } = useUser();
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'workspace'>('home');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      if (hash === '#workspace' || path === '/app' || path === '/workspace') {
        setCurrentView('workspace');
      } else if (hash === '#login' || path === '/login') {
        setCurrentView('login');
      } else {
        setCurrentView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateToLogin = () => {
    window.location.hash = '#login';
    setCurrentView('login');
  };

  const navigateToHome = () => {
    window.location.hash = '';
    setCurrentView('home');
  };

  const navigateToWorkspace = () => {
    window.location.hash = '#workspace';
    setCurrentView('workspace');
  };

  // Render Login View
  if (currentView === 'login') {
    return <LoginPage onBackToHome={navigateToHome} />;
  }

  // Render Main Workspace (Guarded for Authenticated Users)
  if (currentView === 'workspace') {
    if (!isLoaded) {
      return (
        <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center font-mono text-xs">
          Loading Clerk session...
        </div>
      );
    }

    if (!isSignedIn) {
      // Redirect unauthenticated user to login
      return <LoginPage onBackToHome={navigateToHome} />;
    }

    return <WorkspacePage onBackToHome={navigateToHome} />;
  }

  // Render Landing Page
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <Navbar onNavigateToLogin={navigateToLogin} />

      {/* Main Content Sections */}
      <main>
        <Hero onNavigateToLogin={isSignedIn ? navigateToWorkspace : navigateToLogin} />
        <Features />
        <PipelineFlowchart />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
