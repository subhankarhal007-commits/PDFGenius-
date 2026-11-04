import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, HistoryItem, SiteSettings, ToolId } from '../types';
import { PRICING_PLANS } from '../data/toolsData';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  selectedToolId: ToolId | null;
  setSelectedToolId: (toolId: ToolId | null) => void;
  user: UserAccount | null;
  login: (email: string, role?: 'user' | 'admin') => void;
  logout: () => void;
  register: (name: string, email: string) => void;
  upgradePlan: (plan: 'free' | 'pro' | 'business') => void;
  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  currentPdfFile: { name: string; bytes: Uint8Array; pageCount: number } | null;
  setCurrentPdfFile: (file: { name: string; bytes: Uint8Array; pageCount: number } | null) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  openToolWithFile: (toolId: ToolId, file?: { name: string; bytes: Uint8Array; pageCount: number }) => void;
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  authModalMode: 'login' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'login' | 'signup' | 'forgot') => void;
}

const defaultSettings: SiteSettings = {
  siteName: 'PDFGenius',
  tagline: 'Your All-in-One PDF Workspace',
  logoUrl: '',
  maintenanceMode: false,
  showAds: false,
  adSenseCode: '',
  adsterraAds: {
    socialBar: { enabled: false, code: '' },
    banner728x90: { enabled: false, code: '' },
    banner300x250: { enabled: false, code: '' },
    banner320x50: { enabled: false, code: '' },
    nativeBanner: { enabled: false, code: '' },
    popunder: { enabled: false, code: '' },
  },
  freeDailyLimit: 9999,
  proDailyLimit: 9999,
  maxUploadSizeMB: 50,
  disabledTools: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL hash/query/path for direct admin access
  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash.includes('admin') || search.includes('admin') || path.includes('/admin')) {
        return 'admin';
      }
    } catch (e) {
      console.warn('URL parsing error:', e);
    }
    return 'home';
  });

  const [selectedToolId, setSelectedToolId] = useState<ToolId | null>(null);
  const [currentPdfFile, setCurrentPdfFile] = useState<{
    name: string;
    bytes: Uint8Array;
    pageCount: number;
  } | null>(null);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Genuine Admin user account (subhankarhal007@gmail.com)
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('pdfgenius_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === 'admin@pdfgenius.com' || parsed.id === 'usr_admin_workspace') {
          parsed.email = 'subhankarhal007@gmail.com';
          parsed.name = 'Subhankar';
          localStorage.setItem('pdfgenius_user', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse user storage:', e);
    }
    return {
      id: 'admin_subhankar',
      name: 'Subhankar',
      email: 'subhankarhal007@gmail.com',
      role: 'admin',
      plan: 'pro',
      dailyOperationsCount: 0,
      maxDailyOperations: 9999,
      createdAt: '2026-11-04',
    };
  });

  // Real history in localStorage - no dummy files
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('pdfgenius_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse history:', e);
    }
    return [];
  });

  // Site settings with logo and Adsterra ad slots
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('pdfgenius_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          adsterraAds: {
            ...defaultSettings.adsterraAds,
            ...(parsed.adsterraAds || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse settings:', e);
    }
    return defaultSettings;
  });

  // Sync hash with admin view so it can be bookmarked or copied
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) {
        setCurrentView('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const login = (email: string, role: 'user' | 'admin' = 'user') => {
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: email.includes('admin') ? 'admin' : role,
      plan: email.includes('admin') ? 'business' : 'free',
      dailyOperationsCount: 0,
      maxDailyOperations: email.includes('admin') ? 9999 : 5,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    localStorage.setItem('pdfgenius_user', JSON.stringify(newUser));
    setShowAuthModal(false);
    showToast(`Welcome back, ${newUser.name}!`, 'success');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pdfgenius_user');
    showToast('Signed out successfully.', 'info');
    setCurrentView('home');
  };

  const register = (name: string, email: string) => {
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: 'user',
      plan: 'free',
      dailyOperationsCount: 0,
      maxDailyOperations: 5,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    localStorage.setItem('pdfgenius_user', JSON.stringify(newUser));
    setShowAuthModal(false);
    showToast(`Account created! Welcome to PDFGenius, ${name}.`, 'success');
  };

  const upgradePlan = (plan: 'free' | 'pro' | 'business') => {
    if (!user) return;
    const planConfig = PRICING_PLANS.find((p) => p.id === plan);
    const updatedUser: UserAccount = {
      ...user,
      plan,
      maxDailyOperations: planConfig ? planConfig.dailyLimit : 5,
    };
    setUser(updatedUser);
    localStorage.setItem('pdfgenius_user', JSON.stringify(updatedUser));
    showToast(`Plan successfully updated to ${plan.toUpperCase()}!`, 'success');
  };

  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: `hist_${Date.now()}`,
      timestamp: Date.now(),
    };
    setHistory((prev) => {
      const next = [newItem, ...prev.slice(0, 19)];
      localStorage.setItem('pdfgenius_history', JSON.stringify(next));
      return next;
    });

    // Increment daily count
    if (user) {
      setUser((prevUser) => {
        if (!prevUser) return null;
        const updated = {
          ...prevUser,
          dailyOperationsCount: prevUser.dailyOperationsCount + 1,
        };
        localStorage.setItem('pdfgenius_user', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('pdfgenius_history');
    showToast('Activity history cleared.', 'info');
  };

  const updateSiteSettings = (settings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem('pdfgenius_settings', JSON.stringify(updated));
      return updated;
    });
    showToast('Settings saved successfully.', 'success');
  };

  const openToolWithFile = (
    toolId: ToolId,
    file?: { name: string; bytes: Uint8Array; pageCount: number }
  ) => {
    setSelectedToolId(toolId);
    if (file) {
      setCurrentPdfFile(file);
    }
    if (toolId === 'editor') {
      setCurrentView('editor');
    } else {
      setCurrentView('tools-workspace');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedToolId,
        setSelectedToolId,
        user,
        login,
        logout,
        register,
        upgradePlan,
        history,
        addHistoryItem,
        clearHistory,
        siteSettings,
        updateSiteSettings,
        currentPdfFile,
        setCurrentPdfFile,
        toasts,
        showToast,
        openToolWithFile,
        showAuthModal,
        setShowAuthModal,
        authModalMode,
        setAuthModalMode,
      }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-3 transition-all transform duration-200 animate-in slide-in-from-bottom-2 ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'info'
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
