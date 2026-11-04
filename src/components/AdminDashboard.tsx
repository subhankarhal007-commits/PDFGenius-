import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_TOOLS } from '../data/toolsData';
import { ToolId, AdsterraConfig } from '../types';
import { 
  ShieldAlert, 
  Users, 
  FileText, 
  Activity, 
  DollarSign, 
  Sliders, 
  Check, 
  Mail, 
  Save, 
  Globe, 
  Plus, 
  Trash2, 
  HardDrive,
  Upload,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Eye,
  Radio,
  Tv,
  Smartphone,
  LayoutGrid,
  Link,
  RotateCcw,
  UserCheck
} from 'lucide-react';

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'suspended';
  filesProcessed: number;
}

interface ContactMessage {
  id: string;
  from: string;
  email: string;
  date: string;
  subject: string;
  body: string;
  status: 'unread' | 'read' | 'replied';
}

export const AdminDashboard: React.FC = () => {
  const { siteSettings, updateSiteSettings, showToast, user, history } = useApp();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'branding' | 'adsterra' | 'users' | 'admin-profile' | 'tools' | 'monetization' | 'messages'
  >('overview');

  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Genuine Users state loaded from localStorage (defaults to empty [] with NO dummy demo user)
  const [usersList, setUsersList] = useState<WorkspaceUser[]>(() => {
    try {
      const saved = localStorage.getItem('pdfgenius_registered_users');
      if (saved) {
        const parsed: WorkspaceUser[] = JSON.parse(saved);
        // Filter out any obsolete dummy users from older sessions
        const cleaned = parsed.filter(
          (u) => u.email !== 'admin@pdfgenius.com' && u.name !== 'Workspace Administrator' && !u.id.includes('demo')
        );
        return cleaned;
      }
    } catch (e) {
      console.warn('Failed to parse users storage:', e);
    }
    return [];
  });

  // User creation form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [newUserPlan, setNewUserPlan] = useState<'free' | 'pro' | 'business'>('pro');

  // 2. Genuine Contact messages from localStorage
  const [messages, setMessages] = useState<ContactMessage[]>(() => {
    try {
      const saved = localStorage.getItem('pdfgenius_contact_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse messages storage:', e);
    }
    return [];
  });

  // 3. Logo & Branding state
  const [siteName, setSiteName] = useState(siteSettings.siteName);
  const [tagline, setTagline] = useState(siteSettings.tagline);
  const [logoUrl, setLogoUrl] = useState(siteSettings.logoUrl || '');

  // 4. Adsterra Ads Configuration state
  const [adsterraConfig, setAdsterraConfig] = useState<AdsterraConfig>(() => {
    const defaultAdsterra: AdsterraConfig = {
      socialBar: { enabled: false, code: '' },
      banner728x90: { enabled: false, code: '' },
      banner300x250: { enabled: false, code: '' },
      banner320x50: { enabled: false, code: '' },
      nativeBanner: { enabled: false, code: '' },
      popunder: { enabled: false, code: '' },
    };
    return {
      ...defaultAdsterra,
      ...(siteSettings.adsterraAds || {}),
    };
  });

  // 5. Admin profile state (Subhankar)
  const [adminName, setAdminName] = useState(user?.name || 'Subhankar');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'subhankarhal007@gmail.com');

  // 6. Limits & Site settings
  const [freeDailyLimit, setFreeDailyLimit] = useState(siteSettings.freeDailyLimit);
  const [proDailyLimit, setProDailyLimit] = useState(siteSettings.proDailyLimit);
  const [maxUploadSizeMB, setMaxUploadSizeMB] = useState(siteSettings.maxUploadSizeMB);
  const [maintenanceMode, setMaintenanceMode] = useState(siteSettings.maintenanceMode);

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pdfgenius_registered_users', JSON.stringify(usersList));
    } catch (e) {
      console.warn('Failed to persist users:', e);
    }
  }, [usersList]);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pdfgenius_contact_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist contact messages:', e);
    }
  }, [messages]);

  // Handle Logo Upload from Local Device
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        updateSiteSettings({ logoUrl: reader.result });
        showToast('Logo uploaded and applied across website!', 'success');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetLogo = () => {
    setLogoUrl('');
    updateSiteSettings({ logoUrl: '' });
    showToast('Logo reset to default brand icon.', 'info');
  };

  const handleSaveBranding = () => {
    updateSiteSettings({
      siteName,
      tagline,
      logoUrl,
    });
    showToast('Branding & Logo settings saved!', 'success');
  };

  // Handle Adsterra ad update
  const handleAdsterraFieldChange = (
    type: keyof AdsterraConfig, 
    field: 'enabled' | 'code', 
    value: boolean | string
  ) => {
    setAdsterraConfig((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSaveAdsterra = () => {
    updateSiteSettings({
      adsterraAds: adsterraConfig,
      showAds: true,
    });
    showToast('Adsterra ads configured and activated across site!', 'success');
  };

  // Save admin profile
  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updated = {
        ...user,
        name: adminName.trim(),
        email: adminEmail.trim(),
      };
      localStorage.setItem('pdfgenius_user', JSON.stringify(updated));
      showToast('Admin profile updated successfully!', 'success');
    }
  };

  // Direct Admin Portal Link
  const directAdminLink = `${window.location.origin}${window.location.pathname}#admin`;

  const copyAdminLink = () => {
    navigator.clipboard.writeText(directAdminLink);
    showToast('Direct Admin Link copied to clipboard!', 'success');
  };

  // Real telemetry metrics
  const totalFilesProcessed = history.length;
  const totalBytesProcessed = history.reduce((acc, h) => acc + (h.fileSize || 0), 0);
  const totalMegabytes = (totalBytesProcessed / (1024 * 1024)).toFixed(2);
  const activeToolsCount = ALL_TOOLS.length - (siteSettings.disabledTools?.length || 0);

  // Real tool operations frequencies
  const toolUsageMap: Record<string, number> = {};
  history.forEach((item) => {
    const key = item.toolUsed || 'Unknown Tool';
    toolUsageMap[key] = (toolUsageMap[key] || 0) + 1;
  });
  const sortedToolUsage = Object.entries(toolUsageMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: totalFilesProcessed > 0 ? Math.round((count / totalFilesProcessed) * 100) : 0,
    }));

  const handleToggleTool = (toolId: ToolId) => {
    const currentDisabled = siteSettings.disabledTools || [];
    const isCurrentlyDisabled = currentDisabled.includes(toolId);
    const updated = isCurrentlyDisabled
      ? currentDisabled.filter((id) => id !== toolId)
      : [...currentDisabled, toolId];

    updateSiteSettings({ disabledTools: updated });
    showToast(`Tool ${isCurrentlyDisabled ? 'enabled' : 'disabled'}.`, 'info');
  };

  const handleSaveGeneralSettings = () => {
    updateSiteSettings({
      freeDailyLimit,
      proDailyLimit,
      maxUploadSizeMB,
      maintenanceMode,
    });
    showToast('System limits saved successfully!', 'success');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Please enter a name and email.', 'error');
      return;
    }
    const createdUser: WorkspaceUser = {
      id: `usr_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      plan: newUserPlan,
      status: 'active',
      filesProcessed: 0,
    };
    setUsersList((prev) => [...prev, createdUser]);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUser(false);
    showToast(`User ${createdUser.name} added to directory!`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    showToast('User removed.', 'info');
  };

  const toggleUserStatus = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
          : u
      )
    );
    showToast('User status updated.', 'info');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-100/90 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Direct Admin Access Notification Card */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0">
              <Link className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                  Direct Portal URL
                </span>
                <span className="text-xs text-slate-300 font-medium">Public link removed from website</span>
              </div>
              <p className="text-sm font-mono text-purple-200 mt-1 break-all bg-black/30 px-3 py-1.5 rounded-xl border border-purple-500/20">
                {directAdminLink}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyAdminLink}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Admin Link</span>
            </button>
          </div>
        </div>

        {/* Admin Header with Live Status & Active Logo Preview */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {siteSettings.logoUrl ? (
              <img 
                src={siteSettings.logoUrl} 
                alt="Active Logo" 
                className="h-12 max-w-[160px] object-contain rounded-xl border border-slate-200 p-1 bg-slate-50" 
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {siteSettings.siteName} Master Control
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin: <span className="font-semibold text-slate-800">{adminName}</span> ({adminEmail})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Verified System Active</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: Activity },
            { id: 'branding', label: 'Logo & Branding', icon: ImageIcon },
            { id: 'adsterra', label: 'Adsterra Ads Manager', icon: Tv },
            { id: 'users', label: `User Directory (${usersList.length})`, icon: Users },
            { id: 'admin-profile', label: 'Admin Account', icon: UserCheck },
            { id: 'tools', label: `Tools Config (${activeToolsCount}/${ALL_TOOLS.length})`, icon: Sliders },
            { id: 'monetization', label: 'Limits & System', icon: DollarSign },
            { id: 'messages', label: `Inquiries (${messages.length})`, icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Registered Users
                </span>
                <p className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                  {usersList.length}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                  Genuine accounts in storage
                </span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  PDFs Processed
                </span>
                <p className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                  {totalFilesProcessed}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                  Live session documents
                </span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Data Volume
                </span>
                <p className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                  {totalMegabytes} <span className="text-sm font-semibold text-slate-500">MB</span>
                </p>
                <span className="text-[11px] text-purple-600 font-semibold font-mono">
                  Processed in RAM
                </span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Tools
                </span>
                <p className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                  {activeToolsCount} / {ALL_TOOLS.length}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                  100% Client-Side Engine
                </span>
              </div>
            </div>

            {/* Popular tools breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Live Tool Operations Breakdown</h3>
                <span className="text-xs text-slate-400 font-mono">{totalFilesProcessed} total operations</span>
              </div>

              {sortedToolUsage.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Operations Recorded Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                    Process or edit any PDF document using the editor or any of the 22+ tools to populate live telemetry.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedToolUsage.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span className="font-mono text-slate-500">{item.count} operation{item.count > 1 ? 's' : ''} ({item.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SITE LOGO & BRANDING */}
        {activeTab === 'branding' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Website Logo & Identity</h3>
              <p className="text-xs text-slate-500">
                Upload your custom logo image. It will immediately replace the site branding across the header, footer, and navigation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Logo Preview & Upload Box */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center text-center space-y-4">
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />

                <div className="w-48 h-20 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center p-2 overflow-hidden">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Website Logo Preview" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-base font-bold text-slate-900">
                        PDF<span className="text-emerald-600">Genius</span>
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {logoUrl ? 'Custom Logo Active' : 'Default Logo Active'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recommended: Transparent PNG or SVG (height ~40px to 60px)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo File</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Reset to default logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Text Fields & Logo URL Option */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Or Enter Logo Image URL:
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Direct public image link or CDN hosted URL
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Website Name:
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Website Tagline:
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveBranding}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Logo & Branding Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADSTERRA ADS MANAGER */}
        {activeTab === 'adsterra' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">Adsterra Advertising Network Configuration</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                    6 Ad Formats Supported
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Paste your Adsterra ad codes, script tags, iframes, or direct SmartLinks. Ads will render in their exact designated placements across the website.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveAdsterra}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-colors shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Save All Adsterra Ads</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Social Bar Ads */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900">Social Bar Ads</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {adsterraConfig.socialBar.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={adsterraConfig.socialBar.enabled}
                      onChange={(e) => handleAdsterraFieldChange('socialBar', 'enabled', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Placement: Floating bottom-right notification widget across all public pages.
                </p>
                <textarea
                  rows={3}
                  value={adsterraConfig.socialBar.code}
                  onChange={(e) => handleAdsterraFieldChange('socialBar', 'code', e.target.value)}
                  placeholder="Paste Adsterra Social Bar <script> tag or direct link..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white resize-y"
                />
              </div>

              {/* 2. Banner 728x90 Ads */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Banner 728x90 Ads (Desktop Leaderboard)</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {adsterraConfig.banner728x90.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={adsterraConfig.banner728x90.enabled}
                      onChange={(e) => handleAdsterraFieldChange('banner728x90', 'enabled', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Placement: Centered at top of Home, All-Tools, and inside Tools Workspace on desktop screens.
                </p>
                <textarea
                  rows={3}
                  value={adsterraConfig.banner728x90.code}
                  onChange={(e) => handleAdsterraFieldChange('banner728x90', 'code', e.target.value)}
                  placeholder="Paste Adsterra 728x90 banner code, script tag, or direct link..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white resize-y"
                />
              </div>

              {/* 3. Banner 300x250 Ads */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Banner 300x250 Ads (Medium Rectangle)</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {adsterraConfig.banner300x250.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={adsterraConfig.banner300x250.enabled}
                      onChange={(e) => handleAdsterraFieldChange('banner300x250', 'enabled', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Placement: Mid-page between sections and beside tools processing workspace.
                </p>
                <textarea
                  rows={3}
                  value={adsterraConfig.banner300x250.code}
                  onChange={(e) => handleAdsterraFieldChange('banner300x250', 'code', e.target.value)}
                  placeholder="Paste Adsterra 300x250 banner script or link..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white resize-y"
                />
              </div>

              {/* 4. Banner 320x50 Ads */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">Banner 320x50 Ads (Mobile Banner)</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {adsterraConfig.banner320x50.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={adsterraConfig.banner320x50.enabled}
                      onChange={(e) => handleAdsterraFieldChange('banner320x50', 'enabled', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Placement: Top banner optimized exclusively for smartphones and mobile devices.
                </p>
                <textarea
                  rows={3}
                  value={adsterraConfig.banner320x50.code}
                  onChange={(e) => handleAdsterraFieldChange('banner320x50', 'code', e.target.value)}
                  placeholder="Paste Adsterra 320x50 mobile banner code or direct link..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white resize-y"
                />
              </div>

              {/* 5. Native Banner Ads */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-900">Native Banner Ads</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {adsterraConfig.nativeBanner.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={adsterraConfig.nativeBanner.enabled}
                      onChange={(e) => handleAdsterraFieldChange('nativeBanner', 'enabled', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Placement: Seamlessly embedded below Popular Tools and on All-Tools archive page.
                </p>
                <textarea
                  rows={3}
                  value={adsterraConfig.nativeBanner.code}
                  onChange={(e) => handleAdsterraFieldChange('nativeBanner', 'code', e.target.value)}
                  placeholder="Paste Adsterra Native Banner script or widget snippet..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white resize-y"
                />
              </div>

              {/* 6. Popunder Ads */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">Popunder Ads</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {adsterraConfig.popunder.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={adsterraConfig.popunder.enabled}
                      onChange={(e) => handleAdsterraFieldChange('popunder', 'enabled', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Placement: Triggers popunder window on initial visitor interaction or document click.
                </p>
                <textarea
                  rows={3}
                  value={adsterraConfig.popunder.code}
                  onChange={(e) => handleAdsterraFieldChange('popunder', 'code', e.target.value)}
                  placeholder="Paste Adsterra Popunder script code or direct link URL..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white resize-y"
                />
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAdsterra}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save and Publish Adsterra Ads</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: USERS DIRECTORY - 100% GENUINE, ZERO DEMO DUMMY USERS */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">User Directory</h3>
                <p className="text-xs text-slate-500">
                  Genuine user accounts registered in this application. No dummy records.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>

            {/* Add User Inline Form */}
            {showAddUser && (
              <form onSubmit={handleAddUser} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-slate-800">Add New User to Directory</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Full Name"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Email Address"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    value={newUserPlan}
                    onChange={(e) => setNewUserPlan(e.target.value as any)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="free">Free Tier</option>
                    <option value="pro">Pro Tier</option>
                    <option value="business">Business Tier</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    Save User
                  </button>
                </div>
              </form>
            )}

            {usersList.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Registered Users Yet</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  All dummy records have been removed. Any team member or client registered will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddUser(true)}
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First User</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="pb-3 pl-2">User</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Plan Tier</th>
                      <th className="pb-3">Processed</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pl-2 font-bold text-slate-900">{u.name}</td>
                        <td className="py-3 text-slate-600 font-mono">{u.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-800 uppercase">{u.plan}</td>
                        <td className="py-3 font-mono text-slate-600">{u.filesProcessed} files</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2 space-x-2">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              u.status === 'active'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ADMIN ACCOUNT PROFILE */}
        {activeTab === 'admin-profile' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Administrator Credentials & Access</h3>
              <p className="text-xs text-slate-500">
                Manage your master administrative account and private portal access
              </p>
            </div>

            <form onSubmit={handleSaveAdminProfile} className="max-w-lg space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Name:
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Email:
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Primary system email: subhankarhal007@gmail.com
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                <span className="text-xs font-bold text-purple-900">Secret Admin Access URL</span>
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  To prevent public visitors from discovering your Admin Panel, keep this link private and bookmarked:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={directAdminLink}
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-purple-300 rounded-lg text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={copyAdminLink}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: TOOLS CONFIG */}
        {activeTab === 'tools' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Enable or Disable Tools</h3>
              <p className="text-xs text-slate-500">
                Instantly toggle individual PDF tools on the platform for maintenance or operational limits
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_TOOLS.map((t) => {
                const isDisabled = siteSettings.disabledTools?.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.title}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{t.category}</span>
                    </div>

                    <button
                      onClick={() => handleToggleTool(t.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        isDisabled
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isDisabled ? 'Disabled' : 'Active'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: MONETIZATION & LIMITS */}
        {activeTab === 'monetization' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Usage Quotas & System Limits</h3>
              <p className="text-xs text-slate-500">Configure operations limits, upload constraints, and system switches</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Free Tier Daily Operations Limit:
                  </label>
                  <input
                    type="number"
                    value={freeDailyLimit}
                    onChange={(e) => setFreeDailyLimit(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">High limit enables unrestricted processing for all users.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Upload File Size (MB):
                  </label>
                  <input
                    type="number"
                    value={maxUploadSizeMB}
                    onChange={(e) => setMaxUploadSizeMB(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">Maintenance Mode Gate</span>
                    <p className="text-[11px] text-slate-500">Temporarily pauses public access while upgrades take place</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">Local Storage Persistence:</span>
                    <span className="text-emerald-700 font-mono">Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveGeneralSettings}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Limits & Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Customer Inquiries</h3>
                <p className="text-xs text-slate-500">Live contact inquiries submitted via Contact Support</p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    setMessages([]);
                    showToast('All inquiries cleared.', 'info');
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
                >
                  Clear All Messages
                </button>
              )}
            </div>

            {messages.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Messages Received Yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                  When visitors or team members submit inquiries via the Contact Us form, they will immediately appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{msg.from}</span>
                        <span className="text-slate-400 ml-2 font-mono">({msg.email})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{msg.date}</span>
                        <button
                          onClick={() => {
                            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                            showToast('Message deleted.', 'info');
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-800">{msg.subject}</p>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
