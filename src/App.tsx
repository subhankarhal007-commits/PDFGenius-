import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeHero } from './components/HomeHero';
import { PopularToolsSection } from './components/PopularToolsSection';
import { PromoEditorSection } from './components/PromoEditorSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { WhyChooseSection } from './components/WhyChooseSection';
import { FAQSection } from './components/FAQSection';
import { PDFEditorWorkspace } from './components/PDFEditorWorkspace';
import { PDFToolsWorkspace } from './components/PDFToolsWorkspace';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LegalAndSupport } from './components/LegalAndSupport';
import { AdsterraSlot } from './components/AdsterraSlot';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentView, siteSettings, user } = useApp();

  // Maintenance mode gate (allows admin bypass)
  if (siteSettings.maintenanceMode && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Maintenance in Progress</h1>
        <p className="text-sm text-slate-400 max-w-md">
          {siteSettings.siteName} is undergoing scheduled engine upgrades. All document operations will resume shortly.
        </p>
      </div>
    );
  }

  // Render view
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Top Desktop & Mobile Banner Placements */}
        {currentView !== 'editor' && currentView !== 'admin' && (
          <div className="bg-slate-50/50 border-b border-slate-100">
            <AdsterraSlot type="banner728x90" />
            <AdsterraSlot type="banner320x50" />
          </div>
        )}

        {currentView === 'home' && (
          <>
            <HomeHero />
            <PopularToolsSection />
            <AdsterraSlot type="nativeBanner" />
            <PromoEditorSection />
            <HowItWorksSection />
            <AdsterraSlot type="banner300x250" />
            <WhyChooseSection />
            <FAQSection />
          </>
        )}

        {currentView === 'all-tools' && (
          <div className="py-8">
            <PopularToolsSection />
            <AdsterraSlot type="nativeBanner" />
          </div>
        )}

        {currentView === 'editor' && <PDFEditorWorkspace />}

        {currentView === 'tools-workspace' && (
          <div>
            <PDFToolsWorkspace />
            <AdsterraSlot type="banner728x90" />
            <AdsterraSlot type="banner300x250" />
          </div>
        )}

        {currentView === 'dashboard' && <UserDashboard />}

        {currentView === 'admin' && <AdminDashboard />}

        {['about', 'contact', 'privacy', 'terms', 'cookie-policy', 'refund', 'help'].includes(currentView) && (
          <LegalAndSupport type={currentView as any} />
        )}
      </main>

      {/* Global Adsterra Floating Social Bar & Popunder Trigger */}
      <AdsterraSlot type="socialBar" />
      <AdsterraSlot type="popunder" />

      {/* Do not show standard footer on full-screen editor canvas */}
      {currentView !== 'editor' && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
