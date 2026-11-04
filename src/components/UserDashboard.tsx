import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  FileText, 
  Clock, 
  Upload, 
  Sparkles, 
  Settings, 
  Trash2, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { loadPdfJsDoc } from '../utils/pdfEngine';

export const UserDashboard: React.FC = () => {
  const { 
    user, 
    history, 
    clearHistory, 
    openToolWithFile, 
    setCurrentView, 
    showToast,
    login 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileName, setProfileName] = useState(user?.name || 'Alex Morgan');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const doc = await loadPdfJsDoc(bytes);
      openToolWithFile('editor', {
        name: file.name,
        bytes,
        pageCount: doc.numPages,
      });
      showToast(`Uploaded "${file.name}" to Editor!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Please select a valid PDF file.', 'error');
    }
    e.target.value = '';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      user.name = profileName;
      localStorage.setItem('pdfgenius_user', JSON.stringify(user));
      setIsEditingProfile(false);
      showToast('Profile updated!', 'success');
    }
  };

  const dailyUsed = user?.dailyOperationsCount || 0;
  const dailyMax = user?.maxDailyOperations || 5;
  const usagePercent = Math.min(100, Math.round((dailyUsed / dailyMax) * 100));

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* WELCOME BANNER & PROFILE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, {user?.name || 'Workspace User'}!
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {user?.plan || 'Free'} Plan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.email} · Member since {user?.createdAt || '2026-01-15'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleQuickUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New PDF</span>
            </button>
            <button
              onClick={() => openToolWithFile('editor')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Launch PDF Editor</span>
            </button>
          </div>
        </div>

        {/* STATS & QUOTA GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Operations Quota Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Operations Status
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                Unrestricted Access
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full"
                style={{ width: '100%' }}
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Unlimited client-side document processing enabled across all 22+ PDF tools.
            </p>
          </div>

          {/* Documents Processed */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recent Files Processed
            </span>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              {history.length}
            </p>
            <p className="text-[11px] text-slate-400">
              Across Editor, Compress, Merge, and Sign
            </p>
          </div>

          {/* Security Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Local In-Memory Privacy
              </span>
            </div>
            <p className="text-xs text-slate-600">
              All PDF files are isolated in your local browser sandbox.
            </p>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Zero server leakage verified</span>
            </div>
          </div>

        </div>

        {/* RECENT DOCUMENTS & ACTIVITIES */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Documents & Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Session history of documents modified on this device
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No recent documents yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Upload a PDF or launch the editor to start modifying documents.
              </p>
              <button
                onClick={() => setCurrentView('editor')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Launch PDF Editor
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">Document Name</th>
                    <th className="pb-3">Tool Applied</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pl-2 font-medium text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-xs">{item.fileName}</span>
                      </td>
                      <td className="py-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                          {item.toolUsed}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-500">
                        {(item.fileSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <button
                          onClick={() => openToolWithFile('editor')}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                        >
                          Reopen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ACCOUNT PROFILE SETTINGS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Account & Profile Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage your display name and login credentials</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="max-w-md space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || 'alex.morgan@example.com'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
