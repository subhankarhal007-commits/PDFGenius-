import React from 'react';
import { useApp } from '../context/AppContext';
import { FileText, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, openToolWithFile, siteSettings } = useApp();

  const handleNav = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      {/* Top Banner Notice */}
      <div className="border-b border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              Bank-Grade In-Memory Encryption: All PDF modifications execute directly in your browser.
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Zero Remote Storage</span>
            <span>·</span>
            <span>GDPR & HIPAA Friendly</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              {siteSettings.logoUrl ? (
                <img 
                  src={siteSettings.logoUrl} 
                  alt={siteSettings.siteName} 
                  className="h-8 max-w-[160px] object-contain rounded" 
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-purple-600 flex items-center justify-center text-white">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white tracking-tight">
                    PDF<span className="text-emerald-400">Genius</span>
                  </span>
                </div>
              )}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Your all-in-one PDF workspace. Edit text, convert formats, compress files, sign contracts, and manage documents with zero software installation required.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => openToolWithFile('editor')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors font-medium flex items-center gap-1.5 text-xs"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Launch PDF Studio</span>
              </button>
            </div>
          </div>

          {/* Tools Col */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">
              Popular Tools
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => openToolWithFile('editor')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Online PDF Editor
                </button>
              </li>
              <li>
                <button
                  onClick={() => openToolWithFile('merge')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Merge PDF Files
                </button>
              </li>
              <li>
                <button
                  onClick={() => openToolWithFile('split')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Split & Extract Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => openToolWithFile('compress')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Compress PDF Size
                </button>
              </li>
              <li>
                <button
                  onClick={() => openToolWithFile('sign')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Electronic Signature
                </button>
              </li>
              <li>
                <button
                  onClick={() => openToolWithFile('ocr')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  OCR Text Recognition
                </button>
              </li>
            </ul>
          </div>

          {/* Solutions & Product */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNav('all-tools')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  All 22+ Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => openToolWithFile('editor')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  PDF Editor Studio
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('dashboard')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  User Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('about')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  About PDFGenius
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('help')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">
              Legal & Privacy
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNav('privacy')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('terms')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('cookie-policy')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('refund')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('contact')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Contact Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div className="flex items-center gap-3">
            <p>© {new Date().getFullYear()} {siteSettings.siteName}. All rights reserved.</p>
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = 'admin';
                handleNav('admin');
              }}
              title="Admin Portal Entry"
              className="text-slate-700 hover:text-slate-400 text-[10px] transition-colors"
            >
              Console
            </a>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5" />
            <span>for frictionless document workflows</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
