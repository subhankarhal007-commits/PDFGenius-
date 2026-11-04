import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  ShieldAlert, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    setSelectedToolId,
    siteSettings
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditorDirectly = () => {
    setSelectedToolId('editor');
    navigateTo('editor');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand / Custom Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            {siteSettings.logoUrl ? (
              <img 
                src={siteSettings.logoUrl} 
                alt={siteSettings.siteName} 
                className="h-9 max-w-[170px] object-contain rounded-md transition-transform group-hover:scale-105" 
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-purple-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  PDF<span className="text-emerald-600">Genius</span>
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => navigateTo('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentView === 'home' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            Home
          </button>

          <button
            onClick={() => navigateTo('all-tools')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentView === 'all-tools' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            All Tools
          </button>

          <button
            onClick={() => navigateTo('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              currentView === 'dashboard' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            Dashboard
          </button>
        </nav>

        {/* Zone 3: Direct Actions (No login/signup required) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={openEditorDirectly}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Editor</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <button
            onClick={() => navigateTo('home')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('all-tools')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            All Tools
          </button>
          <button
            onClick={() => navigateTo('dashboard')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Dashboard
          </button>
          <button
            onClick={openEditorDirectly}
            className="w-full py-2.5 text-center text-xs font-semibold text-white bg-emerald-600 rounded-lg shadow-sm"
          >
            Launch PDF Editor
          </button>
        </div>
      )}
    </header>
  );
};
