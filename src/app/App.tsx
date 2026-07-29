import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { PipelineFlowchart } from './components/PipelineFlowchart';
import { Footer } from './components/Footer';
import { LoginPage } from './pages/LoginPage';
import { NotebooksDashboardPage, type Notebook } from './pages/NotebooksDashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';

export function App() {
  const { isSignedIn, isLoaded } = useUser();
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'notebooks' | 'workspace'>('home');
  const [selectedNotebook, setSelectedNotebook] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      if (hash === '#workspace' || path === '/workspace' || path === '/app') {
        setCurrentView('workspace');
      } else if (hash === '#notebooks' || path === '/notebooks') {
        setCurrentView('notebooks');
      } else if (hash === '#login' || path === '/login') {
        setCurrentView('login');
      } else {
        // Default landing: if logged in and visiting root, take user to notebooks!
        if (isSignedIn && hash === '') {
          setCurrentView('notebooks');
        } else {
          setCurrentView('home');
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isSignedIn]);

  const navigateToLogin = () => {
    window.location.hash = '#login';
    setCurrentView('login');
  };

  const navigateToHome = () => {
    window.location.hash = '';
    setCurrentView('home');
  };

  const navigateToNotebooks = () => {
    window.location.hash = '#notebooks';
    setCurrentView('notebooks');
  };

  const handleSelectNotebook = (notebook: Notebook) => {
    setSelectedNotebook({ id: notebook.id, name: notebook.name });
    window.location.hash = `#workspace`;
    setCurrentView('workspace');
  };

  // Render Login View
  if (currentView === 'login') {
    return <LoginPage onBackToHome={navigateToHome} />;
  }

  // Guard for Authenticated Views
  if (currentView === 'notebooks' || currentView === 'workspace') {
    if (!isLoaded) {
      return (
        <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center font-mono text-xs">
          Loading Clerk session...
        </div>
      );
    }

    if (!isSignedIn) {
      return <LoginPage onBackToHome={navigateToHome} />;
    }

    if (currentView === 'notebooks') {
      return (
        <NotebooksDashboardPage
          onSelectNotebook={handleSelectNotebook}
          onBackToHome={navigateToHome}
        />
      );
    }

    return (
      <WorkspacePage
        onBackToHome={navigateToHome}
        onBackToDashboard={navigateToNotebooks}
        notebookId={selectedNotebook?.id}
        notebookTitle={selectedNotebook?.name}
      />
    );
  }

  // Render Landing Page
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <Navbar onNavigateToLogin={isSignedIn ? navigateToNotebooks : navigateToLogin} />

      {/* Main Content Sections */}
      <main>
        <Hero onNavigateToLogin={isSignedIn ? navigateToNotebooks : navigateToLogin} />
        <Features />
        <PipelineFlowchart />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
