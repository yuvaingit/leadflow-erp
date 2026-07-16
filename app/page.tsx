'use client';

import React, { useState, useMemo, useEffect } from 'react';
// 1. Type Architecture definitions
type Stage = 'new' | 'contacted' | 'proposal' | 'won' | 'lost';
type Currency = 'INR' | 'USD' | 'EUR';
type Density = 'cozy' | 'compact';
type ThemeAccent = 'lavender' | 'sage' | 'slate';
type UIMode = 'light' | 'dark';
type TabView = 'deals' | 'leads' | 'feeds' | 'home';
interface CRMNotification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}
interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  timestamp: string;
  note: string;
}
interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  value: number; 
  stage: Stage;
  activities?: Activity[];
  outcomeReason?: string;
}
interface StageConfig {
  id: Stage;
  label: string;
  colorClass: (mode: UIMode) => string;
}
// 2. Constants & Configuration Settings
const STAGES: StageConfig[] = [
  { id: 'new', label: 'New Lead', colorClass: (m) => m === 'light' ? 'bg-purple-50/80 text-purple-700 border-purple-200/60' : 'bg-purple-950/40 text-purple-300 border-purple-800/50' },
  { id: 'contacted', label: 'Contacted', colorClass: (m) => m === 'light' ? 'bg-blue-50/80 text-blue-700 border-blue-200/60' : 'bg-blue-950/40 text-blue-300 border-blue-800/50' },
  { id: 'proposal', label: 'Proposal', colorClass: (m) => m === 'light' ? 'bg-amber-50/80 text-amber-700 border-amber-200/60' : 'bg-amber-950/40 text-amber-300 border-amber-800/50' },
  { id: 'won', label: 'Won', colorClass: (m) => m === 'light' ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50' },
  { id: 'lost', label: 'Lost', colorClass: (m) => m === 'light' ? 'bg-rose-50/80 text-rose-700 border-rose-200/60' : 'bg-rose-950/40 text-rose-300 border-rose-800/50' },
];
const INITIAL_LEADS: Lead[] = [
  { id: '1', companyName: 'Zoho', contactPerson: 'Sridhar Vembu', email: 'sridhar@zoho.com', value: 120000, stage: 'new', activities: [{ id: 'act-1', type: 'email', timestamp: '10:15 AM', note: 'Sent introduction package.' }] },
  { id: '2', companyName: 'Caterpillar', contactPerson: 'Jim Umpleby', email: 'jim@cat.com', value: 450000, stage: 'proposal', activities: [{ id: 'act-2', type: 'meeting', timestamp: 'Yesterday', note: 'Technical review session completed.' }] },
  { id: '3', companyName: 'Urban Company', contactPerson: 'Abhiraj Bhal', email: 'abhiraj@urbanco.com', value: 750000, stage: 'contacted', activities: [] },
  { id: '4', companyName: 'Amazon', contactPerson: 'Andy Jassy', email: 'andy@amazon.com', value: 85000, stage: 'won', outcomeReason: 'Feature Fit', activities: [{ id: 'act-3', type: 'call', timestamp: '2 days ago', note: 'Final contract signed.' }] },
];

const THEMES = {
  lavender: { accent: 'purple-600', ring: 'ring-purple-400/30', bg: 'bg-purple-600 hover:bg-purple-700', text: 'text-purple-600 dark:text-purple-400' },
  sage: { accent: 'emerald-600', ring: 'ring-emerald-400/30', bg: 'bg-emerald-600 hover:bg-emerald-700', text: 'text-emerald-600 dark:text-emerald-400' },
  slate: { accent: 'slate-900 dark:accent-white', ring: 'ring-slate-400/30', bg: 'bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100', text: 'text-slate-900 dark:text-slate-100' }
};
// 3. Principal Dashboard Shell
export default function LeadFlowDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  // Customizer preferences & Navigation
  const [currentTab, setCurrentTab] = useState<TabView>('deals');
  const [density, setDensity] = useState<Density>('cozy');
  const [theme, setTheme] = useState<ThemeAccent>('slate');
  const [uiMode, setUiMode] = useState<UIMode>('light'); 
  // Notification Alerts Hub State
  const [notifications, setNotifications] = useState<CRMNotification[]>([
    { id: 'n-1', text: 'System Update: Welcome to Cloud Shell Pipeline CRM V4.', time: 'Just Now', unread: true },
    { id: 'n-2', text: 'Assigned: Sridhar Vembu lead synced from inbound traffic.', time: '10 mins ago', unread: true }
  ]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Search, Filters & Action Menus
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('INR');
  const [showUtilityMenu, setShowUtilityMenu] = useState(false);
  // Modals & Side Drawer panels
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newValue, setNewValue] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ leadId: string; targetStage: 'won' | 'lost' } | null>(null);

  // Syncing with browser LocalStorage
    useEffect(() => {
    const savedLeads = localStorage.getItem('leadflow_v4_data');
    const savedDensity = localStorage.getItem('leadflow_pref_density');
    const savedTheme = localStorage.getItem('leadflow_pref_theme');
    const savedUiMode = localStorage.getItem('leadflow_pref_uimode');

    setLeads(savedLeads ? JSON.parse(savedLeads) : INITIAL_LEADS);
    if (savedDensity) setDensity(savedDensity as Density);
    if (savedTheme) setTheme(savedTheme as ThemeAccent);
    if (savedUiMode) setUiMode(savedUiMode as UIMode);

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('leadflow_v4_data', JSON.stringify(leads));
      localStorage.setItem('leadflow_pref_density', density);
      localStorage.setItem('leadflow_pref_theme', theme);
      localStorage.setItem('leadflow_pref_uimode', uiMode);
    }
  }, [leads, density, theme, uiMode, isInitialized]);

  const activeTheme = THEMES[theme];

  const pushNotification = (text: string) => {
    setNotifications(prev => [{ id: Date.now().toString(), text, time: 'Just Now', unread: true }, ...prev]);
  };

  const formatCurrency = (amountInINR: number) => {
    switch (currentCurrency) {
      case 'USD': return '$' + Math.round(amountInINR / 85).toLocaleString('en-US');
      case 'EUR': return '€' + Math.round(amountInINR / 92).toLocaleString('en-US');
      case 'INR': default: return '₹' + amountInINR.toLocaleString('en-IN');
    }
  };

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(l => 
      l.companyName.toLowerCase().includes(query) || 
      l.contactPerson.toLowerCase().includes(query) ||
      l.email.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  const metrics = useMemo(() => {
    const totalPipeline = leads.reduce((acc, curr) => acc + curr.value, 0);
    const activePipeline = leads.filter(l => l.stage !== 'lost' && l.stage !== 'won').reduce((acc, curr) => acc + curr.value, 0);
    const wonTotal = leads.filter(l => l.stage === 'won').reduce((acc, curr) => acc + curr.value, 0);
    const lostTotal = leads.filter(l => l.stage === 'lost').reduce((acc, curr) => acc + curr.value, 0);
    const activeCount = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost').length;

    const wonPct = totalPipeline ? Math.round((wonTotal / totalPipeline) * 100) : 0;
    const lostPct = totalPipeline ? Math.round((lostTotal / totalPipeline) * 100) : 0;
    const activePct = totalPipeline ? 100 - (wonPct + lostPct) : 0;

    return { activePipeline, wonTotal, lostTotal, activeCount, wonPct, lostPct, activePct, totalPipeline };
  }, [leads]);

  // Drag and Drop Pipeline Events
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (targetStage: Stage) => {
    if (!draggedLeadId) return;
    if (targetStage === 'won' || targetStage === 'lost') {
      setFeedbackTarget({ leadId: draggedLeadId, targetStage });
    } else {
      updateLeadStage(draggedLeadId, targetStage, undefined);
    }
    setDraggedLeadId(null);
  };

  const updateLeadStage = (leadId: string, newStage: Stage, reason?: string) => {
    const leadObj = leads.find(l => l.id === leadId);
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const transitionNote = `Moved deal to ${STAGES.find(s => s.id === newStage)?.label}.` + (reason ? ` Reason: ${reason}` : '');
        const newAct: Activity = { id: Date.now().toString(), type: 'note', timestamp: 'Just Now', note: transitionNote };
        return { 
          ...lead, 
          stage: newStage, 
          outcomeReason: reason || (newStage !== 'won' && newStage !== 'lost' ? undefined : lead.outcomeReason),
          activities: [newAct, ...(lead.activities || [])] 
        };
      }
      return lead;
    }));

    if (leadObj) {
      pushNotification(`Deal updated: "${leadObj.companyName}" transitioned to ${STAGES.find(s => s.id === newStage)?.label}.`);
    }

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => {
        if (!prev) return null;
        const newAct: Activity = { id: Date.now().toString(), type: 'note', timestamp: 'Just Now', note: `Moved deal to ${STAGES.find(s => s.id === newStage)?.label}.` + (reason ? ` Reason: ${reason}` : '') };
        return {
          ...prev,
          stage: newStage,
          outcomeReason: reason || (newStage !== 'won' && newStage !== 'lost' ? undefined : prev.outcomeReason),
          activities: [newAct, ...(prev.activities || [])]
        };
      });
    }
  };

  const handleFeedbackSubmit = (reason: string) => {
    if (!feedbackTarget) return;
    updateLeadStage(feedbackTarget.leadId, feedbackTarget.targetStage, reason);
    setFeedbackTarget(null);
  };

  // Content Operations Methods
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newContactPerson) return;

    let inputVal = Number(newValue) || 0;
    if (currentCurrency === 'USD') inputVal = inputVal * 85;
    if (currentCurrency === 'EUR') inputVal = inputVal * 92;

    const newLead: Lead = {
      id: Date.now().toString(),
      companyName: newCompanyName,
      contactPerson: newContactPerson,
      email: newEmail || 'N/A',
      value: inputVal,
      stage: 'new',
      activities: [{ id: Date.now().toString(), type: 'note', timestamp: 'Just Now', note: 'Lead created in pipeline.' }]
    };

    setLeads(prev => [...prev, newLead]);
    pushNotification(`New Deal Generated: successfully created record for "${newCompanyName}".`);
    setNewCompanyName(''); setNewContactPerson(''); setNewEmail(''); setNewValue('');
    setIsModalOpen(false);
  };

  const handleUpdateLeadDetail = (field: keyof Lead, value: any) => {
    if (!selectedLead) return;
    let targetValue = value;
    if (field === 'value') {
      if (currentCurrency === 'USD') targetValue = Number(value) * 85;
      else if (currentCurrency === 'EUR') targetValue = Number(value) * 92;
      else targetValue = Number(value);
    }

    const updated = { ...selectedLead, [field]: value };
    setSelectedLead(updated);
    setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...updated, value: field === 'value' ? targetValue : updated.value } : l));
  };

  const handleAddActivity = (leadId: string, type: 'call' | 'email' | 'meeting' | 'note', noteText: string) => {
    const newAct: Activity = { id: Date.now().toString(), type, timestamp: 'Just Now', note: noteText };
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, activities: [newAct, ...(l.activities || [])] } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, activities: [newAct, ...(prev.activities || [])] } : null);
    }
  };

  const handleDeleteLead = (id: string) => { 
    const leadObj = leads.find(l => l.id === id);
    setLeads(prev => prev.filter(l => l.id !== id)); 
    if(leadObj) pushNotification(`Deal Purged: removed "${leadObj.companyName}" permanently.`);
    setSelectedLead(null); 
  };
  
  const handleClearBoard = () => { setLeads([]); pushNotification('Board Wiped clean.'); setShowUtilityMenu(false); setSelectedLead(null); };
  const handleResetBoard = () => { setLeads(INITIAL_LEADS); pushNotification('Demo pipeline baseline records reloaded.'); setShowUtilityMenu(false); setSelectedLead(null); };
  const markNotificationsRead = () => { setNotifications(prev => prev.map(n => ({ ...n, unread: false }))); };

  const getDrawerDisplayValue = () => {
    if (!selectedLead) return '';
    if (currentCurrency === 'USD') return Math.round(selectedLead.value / 85);
    if (currentCurrency === 'EUR') return Math.round(selectedLead.value / 92);
    return selectedLead.value;
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 overflow-x-hidden ${
      uiMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-[#faf9f6] text-slate-800'
    }`}>
      
      {/* ZOHO PLATFORM SYSTEM DYNAMIC NAV TOPBAR REPLICA */}
      <nav className={`w-full h-14 sticky top-0 z-40 px-6 flex items-center justify-between border-b shadow-xs transition-colors backdrop-blur-md ${
        uiMode === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-900 text-white border-slate-950'
      }`}>
        {/* Left Side: Brand Logo and Core Module Tab Routing */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab('deals')}>
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500 bg-clip-text text-transparent">Ω CRM</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 tracking-widest border border-slate-700">OS</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium">
            {([
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'deals', label: 'Deals', icon: '💼' },
              { id: 'leads', label: 'Leads', icon: '👤' },
              { id: 'feeds', label: 'Feeds', icon: '📢' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-xs font-semibold ${
                  currentTab === tab.id
                    ? 'bg-slate-800 text-white ring-1 ring-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Search, Notification Bell Center, Mail, Settings, Profile */}
        <div className="flex items-center gap-4">
          
          {/* Global Navbar Quick Search Input bar */}
          <div className="relative hidden sm:block">
            <span className="absolute left-2.5 top-2 text-xs opacity-50">🔍</span>
            <input 
              type="text"
              placeholder="Search CRM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 lg:w-64 text-xs bg-slate-800/60 border border-slate-700 text-slate-200 rounded-lg pl-8 pr-3 py-1.5 outline-none transition focus:border-slate-500 focus:bg-slate-800"
            />
          </div>

          {/* Icon Array Stack Actions */}
          <div className="flex items-center gap-2">
            
            {/* Global Actions Quick-add Trigger */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition flex items-center gap-1"
              title="Create New Entry"
            >
              <span>➕</span> <span className="hidden sm:inline">Create Deal</span>
            </button>

            {/* Simulated Live Messages Inbox */}
            <button className="h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition flex items-center justify-center relative" title="Messages Inbox">
              ✉️
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            </button>

            {/* Interactive Alerts Notifications Center Bell icon dropdown wrapper */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotificationMenu(!showNotificationMenu); markNotificationsRead(); }}
                className={`h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition flex items-center justify-center relative ${showNotificationMenu ? 'bg-slate-800 text-white' : ''}`}
                title="Notifications Center"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-rose-600 text-[9px] font-black text-white flex items-center justify-center px-1 border border-slate-900 animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificationMenu(false)} />
                  <div className="absolute right-0 mt-2 w-72 border border-slate-700 rounded-xl bg-slate-900 shadow-xl overflow-hidden text-slate-200 z-50 animate-fade-in">
                    <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                      <span className="text-xs font-bold tracking-wide">SYSTEM ALERTS LAYER</span>
                      <button onClick={() => setNotifications([])} className="text-[10px] text-slate-500 hover:text-slate-300 transition font-semibold">Clear All</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-800">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-3 text-xs hover:bg-slate-800/40 transition ${n.unread ? 'bg-slate-800/10 border-l-2 border-blue-500' : ''}`}>
                            <p className="leading-normal">{n.text}</p>
                            <span className="text-[9px] text-slate-500 block mt-1">{n.time}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-500">No active system notifications available.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Global Workspace Control Settings Gear icon */}
            <div className="relative">
              <button 
                onClick={() => setShowUtilityMenu(!showUtilityMenu)}
                className={`h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition flex items-center justify-center ${showUtilityMenu ? 'bg-slate-800 text-white' : ''}`}
                title="Workspace System Parameters"
              >
                ⚙️
              </button>

              {showUtilityMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUtilityMenu(false)} />
                  <div className="absolute right-0 mt-2 w-52 border border-slate-700 rounded-xl bg-slate-900 shadow-2xl py-1.5 text-slate-200 z-50 animate-fade-in">
                    <button onClick={handleResetBoard} className="w-full text-left px-4 py-2 text-xs font-medium block transition hover:bg-slate-800">
                      🔄 Restore Baseline Demo Leads
                    </button>
                    <div className="border-t border-slate-800 my-1" />
                    <button onClick={handleClearBoard} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/20 block transition">
                      🗑️ Wipe Board Asset Metrics
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Corporate Profile Avatar User Segment */}
            {/* Corporate Profile Avatar User Segment */}
<div className="relative">
  <button 
    onClick={() => setShowProfileMenu(!showProfileMenu)}
    className="h-8 w-8 rounded-full border border-slate-700 bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white cursor-pointer select-none transition hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
    title="User Session Profile"
  >
    YS
  </button>

  {showProfileMenu && (
    <>
      {/* Click overlay to close dropdown */}
      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
      
      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-64 border border-slate-700 rounded-xl bg-slate-900 shadow-2xl py-2 text-slate-200 z-50 animate-fade-in">
        {/* User Quick Info Header */}
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Signed in as</p>
          <p className="text-sm font-bold text-white mt-0.5">Yuvasri N</p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">ys@gmail.com</p>
        </div>

        {/* Menu Links */}
        <div className="py-1 text-left">
          <button 
            onClick={() => { setShowProfileMenu(false); alert("Navigating to Profile Settings..."); }} 
            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition flex items-center gap-2"
          >
            👤 My Profile
          </button>
          <button 
            onClick={() => { setShowProfileMenu(false); alert("Navigating to Subscriptions..."); }} 
            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition flex items-center gap-2"
          >
            💳 Billing & Subscriptions
          </button>
          <button 
            onClick={() => { setShowProfileMenu(false); alert("Navigating to Security Center..."); }} 
            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition flex items-center gap-2"
          >
            🛡️ Security Settings
          </button>
        </div>

        <div className="border-t border-slate-800 my-1" />

        {/* Sign Out Action */}
        <div className="py-1">
          <button 
            onClick={() => { setShowProfileMenu(false); alert("Logging out of CRM session..."); }} 
            className="w-full text-left px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/20 transition flex items-center gap-2"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </>
  )}
</div>

          </div>
        </div>
      </nav>

      {/* SUB-HEADER COMPONENT CONTENT AREA CONTAINER */}
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Main Secondary Context Ribbon Control bar */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {currentTab === 'deals' && "Pipeline Deal Manager"}
              {currentTab === 'leads' && "Inbound Lead Repository"}
              {currentTab === 'feeds' && "Audit Stream & Feeds"}
              {currentTab === 'home' && "Platform CRM Executive Hub"}
            </h1>
            <p className={`${uiMode === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm mt-1`}>
              {currentTab === 'deals' && "Manage global pipeline pipelines using structured fluid drag stages."}
              {currentTab === 'leads' && "Directory repository grid containing flat inbound corporate prospects."}
              {currentTab === 'feeds' && "System broad audit trail sequence logging modifications real-time."}
              {currentTab === 'home' && "General analytical metrics summary of operation workflows."}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Currency conversion component filter logic */}
            <div className={`p-0.5 rounded-xl flex shadow-xs border ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
              {(['INR', 'USD', 'EUR'] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrentCurrency(curr)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                    currentCurrency === curr 
                      ? (uiMode === 'dark' ? 'bg-white text-slate-950 shadow-xs' : 'bg-slate-950 text-white shadow-xs') 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* INTERFACE STYLING USER EXPERIENCE EMBEDDED PREFERENCES CARD */}
        <section className={`border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
          uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100/80'
        }`}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace Mode:</span>
              <div className={`p-0.5 rounded-xl flex border ${uiMode === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200/60'}`}>
                <button onClick={() => setUiMode('light')} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${uiMode === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}>☀️ Light</button>
                <button onClick={() => setUiMode('dark')} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${uiMode === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400'}`}>🌙 Dark</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accents:</span>
              <div className="flex gap-1.5">
                {([
                  { id: 'lavender', bg: 'bg-purple-500' },
                  { id: 'sage', bg: 'bg-emerald-500' },
                  { id: 'slate', bg: uiMode === 'dark' ? 'bg-white' : 'bg-slate-900' }
                ] as const).map((t) => (
                  <button 
                    key={t.id} onClick={() => setTheme(t.id)} 
                    className={`w-5 h-5 rounded-full ${t.bg} border-2 transition ${theme === t.id ? (uiMode === 'dark' ? 'border-purple-400 scale-110' : 'border-slate-900 scale-110') : 'border-transparent'}`} 
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Density Layout:</span>
            <div className={`p-0.5 rounded-lg flex ${uiMode === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}>
              {([
                { id: 'cozy', label: 'Cozy' },
                { id: 'compact', label: 'Compact' }
              ] as const).map((d) => (
                <button 
                  key={d.id} onClick={() => setDensity(d.id)} 
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition ${density === d.id ? (uiMode === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'bg-transparent text-slate-400') : 'text-slate-400'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* WORKSPACE CONTENT LAYOUT DISPLAY DISPATCHER BASE ROUTER STATE */}
        {currentTab === 'deals' && (
          <div className="space-y-6 animate-fade-in">
            {/* Analytics Summary Bento blocks section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Active Pipeline Asset Base', val: formatCurrency(metrics.activePipeline), sub: 'Ongoing deals (excl. won/lost)', color: uiMode === 'dark' ? 'text-white' : 'text-slate-900' },
                { label: 'Total Settled Revenue Won', val: formatCurrency(metrics.wonTotal), sub: 'Closed-won conversion capital', color: 'text-emerald-500' },
                { label: 'Active Pipeline Headcount', val: metrics.activeCount, sub: 'Individual operations in progress', color: uiMode === 'dark' ? 'text-white' : 'text-slate-900' }
              ].map((bento, idx) => (
                <div key={idx} className={`border rounded-2xl p-6 shadow-sm ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-100'}`}>
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{bento.label}</span>
                  <h2 className={`text-3xl font-bold mt-2 ${bento.color}`}>{bento.val}</h2>
                  <p className="text-xs text-slate-400 mt-1">{bento.sub}</p>
                </div>
              ))}
            </section>

            {/* Pipeline Velocity Health Breakdown Progress Line strip */}
            {metrics.totalPipeline > 0 ? (
              <section className={`border rounded-2xl p-4 shadow-sm space-y-3 ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>PIPELINE DISPERSION VELOCITY VELOCITY TRACK</span>
                  <span className={uiMode === 'dark' ? 'text-slate-200' : 'text-slate-900'}>Gross Value Footprint: {formatCurrency(metrics.totalPipeline)}</span>
                </div>
                <div className={`w-full h-3 rounded-full flex overflow-hidden ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div style={{ width: `${metrics.wonPct}%` }} className="bg-emerald-500 transition-all duration-300 h-full" />
                  <div style={{ width: `${metrics.activePct}%` }} className="bg-slate-400 dark:bg-slate-600 transition-all duration-300 h-full" />
                  <div style={{ width: `${metrics.lostPct}%` }} className="bg-rose-400 transition-all duration-300 h-full" />
                </div>
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium pt-1">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /><span>Won ({metrics.wonPct}%)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 block" /><span>In Progress ({metrics.activePct}%)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" /><span>Lost ({metrics.lostPct}%)</span></div>
                </div>
              </section>
            ) : (
              <section className={`border border-dashed rounded-2xl p-6 text-center text-xs text-slate-400 font-medium tracking-wide ${uiMode === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                No active records. Use "+ Create Deal" in the top bar or workspace actions to seed data.
              </section>
            )}

            {/* Main StageView Kanban Grid Area */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start pt-2">
              {STAGES.map((stage) => {
                const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
                const stageValue = stageLeads.reduce((sum, current) => sum + current.value, 0);

                return (
                  <div
                    key={stage.id}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(stage.id)}
                    className={`border rounded-2xl p-4 min-h-[520px] flex flex-col transition-all duration-200 ${
                      uiMode === 'dark' ? 'bg-slate-900/40 border-slate-900' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    {/* Header Columns details indicators */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${stage.colorClass(uiMode)}`}>
                        {stage.label}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        uiMode === 'dark' ? 'text-slate-400 bg-slate-900 border-slate-800' : 'text-slate-400 bg-white border-slate-100'
                      }`}>
                        {stageLeads.length}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-400 font-medium mb-3 pl-1">
                      Value: {formatCurrency(stageValue)}
                    </div>

                    {/* Stage Card list collection component */}
                    <div className="flex-1 space-y-3">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => setSelectedLead(lead)}
                          className={`border rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group ${
                            density === 'compact' ? 'p-3' : 'p-4'
                          } ${
                            uiMode === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'
                          } ${
                            selectedLead?.id === lead.id 
                              ? `border-${activeTheme.accent} ring-1 ${activeTheme.ring}` 
                              : (uiMode === 'dark' ? 'border-slate-800' : 'border-slate-100')
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`font-semibold transition-colors ${uiMode === 'dark' ? 'text-slate-100 group-hover:text-white' : 'text-slate-900 group-hover:text-slate-950'}`}>
                              {lead.companyName}
                            </h4>
                            {lead.outcomeReason && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${
                                lead.stage === 'won' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {lead.outcomeReason}
                              </span>
                            )}
                          </div>

                          {density === 'cozy' && <p className="text-xs text-slate-400 mt-1">{lead.contactPerson}</p>}
                          
                          <div className={`flex justify-between items-center border-t ${
                            uiMode === 'dark' ? 'border-slate-800' : 'border-slate-50'
                          } ${density === 'compact' ? 'mt-2 pt-2' : 'mt-4 pt-3'}`}>
                            <span className="text-xs text-slate-400 truncate max-w-[100px]">{lead.email}</span>
                            <span className={`text-sm font-semibold ${uiMode === 'dark' ? 'text-white' : 'text-slate-950'}`}>{formatCurrency(lead.value)}</span>
                          </div>
                        </div>
                      ))}
                      
                      {stageLeads.length === 0 && (
                        <div className={`h-28 border border-dashed rounded-xl flex items-center justify-center text-xs text-slate-400 text-center p-2 ${
                          uiMode === 'dark' ? 'border-slate-800' : 'border-slate-200'
                        }`}>
                          {searchQuery ? 'No matching deals' : 'Drag leads here'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* REPLICA CRM FLAT LIST GRID LAYOUT CONTAINER (FOR SIMULATING LEADS TAB) */}
        {currentTab === 'leads' && (
          <div className={`border rounded-2xl p-6 shadow-sm animate-fade-in ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400">Prospect Repositories Database</h3>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/10 text-blue-500">{leads.length} Total Records Loaded</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${uiMode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'} font-bold uppercase tracking-wider`}>
                    <th className="pb-3 pl-2">Company / Client Asset</th>
                    <th className="pb-3">Primary Corporate Rep</th>
                    <th className="pb-3">Communications Routing</th>
                    <th className="pb-3">Gross Deal Worth</th>
                    <th className="pb-3">Status Position</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${uiMode === 'dark' ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {filteredLeads.map((l) => (
                    <tr key={l.id} onClick={() => setSelectedLead(l)} className="hover:bg-slate-500/5 transition-colors cursor-pointer group">
                      <td className="py-3.5 pl-2 font-bold group-hover:text-blue-500">{l.companyName}</td>
                      <td className="py-3.5 text-slate-400">{l.contactPerson}</td>
                      <td className="py-3.5 font-mono text-slate-400">{l.email}</td>
                      <td className="py-3.5 font-semibold">{formatCurrency(l.value)}</td>
                      <td className="py-3.5">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-500/10 border-slate-500/20 text-slate-400">
                          {l.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No active lead assets match your criteria configuration options.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT LOG FEEDS STREAM ENGINE VIEW COMPONENT (FOR SIMULATING FEEDS TAB) */}
        {currentTab === 'feeds' && (
          <div className={`border rounded-2xl p-6 shadow-sm max-w-2xl mx-auto animate-fade-in ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400 mb-6">CRM Activity Audit Stream Feed</h3>
            <div className="space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 rounded-xl border flex gap-3 ${uiMode === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-xl">📢</span>
                  <div>
                    <p className="text-xs leading-relaxed font-medium">{n.text}</p>
                    <span className="text-[10px] text-slate-500 block mt-1.5 font-mono">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLATFORM EXECUTIVE HUB HOME HOME BOARD SEGMENT (FOR SIMULATING HOME TAB) */}
        {currentTab === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className={`border rounded-2xl p-6 shadow-sm ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Pipeline Distribution Summary</h3>
              <div className="space-y-3 pt-2">
                {STAGES.map((s) => {
                  const count = leads.filter(l => l.stage === s.id).length;
                  return (
                    <div key={s.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">{s.label}</span>
                      <span className="font-bold bg-slate-500/10 px-2 py-0.5 rounded">{count} Deals</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-4xl block mb-2">🎯</span>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Total Asset Footprint Metric</h4>
              <h2 className="text-4xl font-black mt-2 bg-gradient-to-r from-blue-500 to-emerald-400 bg-clip-text text-transparent">
                {formatCurrency(leads.reduce((a,c) => a+c.value, 0))}
              </h2>
              <p className="text-[11px] text-slate-500 mt-2 max-w-xs">Includes combined metrics for open pipeline assets, closed-won accounts, and loss metrics logs.</p>
            </div>
          </div>
        )}

      </div>

      {/* REASON DIAGNOSTIC CLOSURE MODAL WINDOW LAYER */}
      {feedbackTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl border shadow-xl max-w-sm w-full p-6 space-y-4 ${
            uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="text-center">
              <span className="text-3xl block mb-2">{feedbackTarget.targetStage === 'won' ? '🎉' : '💔'}</span>
              <h3 className={`text-lg font-bold ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Why was this deal {feedbackTarget.targetStage}?
              </h3>
              <p className="text-xs text-slate-400 mt-1">Capture context for pipeline diagnostic metrics.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {(feedbackTarget.targetStage === 'won' 
                ? ['Pricing', 'Feature Fit', 'Competitor Won', 'Timing', 'Relationship']
                : ['Pricing', 'Budget Cut', 'Lost to Competitor', 'Wrong Timing', 'No Response']
              ).map((reason) => (
                <button
                  key={reason} onClick={() => handleFeedbackSubmit(reason)}
                  className={`text-xs font-semibold py-2 px-3 border rounded-xl transition text-center ${
                    uiMode === 'dark' ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800' : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button onClick={() => handleFeedbackSubmit('Not Specified')} className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 pt-2 transition">
              Skip Reason & Continue
            </button>
          </div>
        </div>
      )}

      {/* QUICK NEW LEADS GENERATOR INPUT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl border shadow-xl max-w-md w-full p-6 space-y-4 ${
            uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${uiMode === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>Create Sale Lead ({currentCurrency})</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold px-2 py-1">✕</button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
              {['Company Name *', 'Contact Person *', 'Email Address', 'Value'].map((label, idx) => {
                const states = [
                  { val: newCompanyName, set: setNewCompanyName, p: 'e.g., Zoho Corporation', type: 'text' },
                  { val: newContactPerson, set: setNewContactPerson, p: 'e.g., Sridhar Vembu', type: 'text' },
                  { val: newEmail, set: setNewEmail, p: 'name@company.com', type: 'email' },
                  { val: newValue, set: setNewValue, p: 'e.g., 500000', type: 'number' }
                ][idx];
                return (
                  <div key={idx}>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">{label}</label>
                    <input 
                      type={states.type} required={label.includes('*')} placeholder={states.p} value={states.val} onChange={e => states.set(e.target.value)} 
                      className={`w-full text-sm border rounded-xl p-2.5 outline-none transition ${
                        uiMode === 'dark' ? 'bg-slate-950 border-slate-800 text-white focus:border-slate-700' : 'bg-white border-slate-200 focus:border-slate-900'
                      }`} 
                    />
                  </div>
                );
              })}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 text-sm font-medium border py-2.5 rounded-xl transition ${uiMode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>Cancel</button>
                <button type="submit" className={`flex-1 text-sm font-medium ${activeTheme.bg} text-white py-2.5 rounded-xl transition`}>Add Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPERATIONS SLIDE OUT INTERACTIVE INSPECTION DRAWER */}
      {selectedLead && (
        <>
          <div className="fixed inset-0 bg-slate-950/40 z-40 animate-fade-in" onClick={() => setSelectedLead(null)} />
          <div className={`fixed right-0 top-0 h-screen w-full max-w-md border-l shadow-2xl z-50 p-6 flex flex-col transition-transform duration-300 transform translate-x-0 overflow-y-auto ${
            uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 mb-6 ${uiMode === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <div>
                <h3 className="text-lg font-bold">Lead Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">ID: {selectedLead.id}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="font-semibold text-sm h-8 w-8 rounded-full flex items-center justify-center border border-slate-500/30">✕</button>
            </div>

            <div className="flex-1 space-y-5">
              {[
                { label: 'Company Name', field: 'companyName', type: 'text', val: selectedLead.companyName },
                { label: 'Contact Representative', field: 'contactPerson', type: 'text', val: selectedLead.contactPerson },
                { label: 'Email Contact', field: 'email', type: 'email', val: selectedLead.email },
                { label: `Deal Valuation (${currentCurrency})`, field: 'value', type: 'number', val: getDrawerDisplayValue() }
              ].map((inp, idx) => (
                <div key={idx}>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{inp.label}</label>
                  <input 
                    type={inp.type} value={inp.val} onChange={e => handleUpdateLeadDetail(inp.field as keyof Lead, e.target.value)} 
                    className={`w-full text-sm border rounded-xl p-2.5 font-medium outline-none transition ${
                      uiMode === 'dark' ? 'bg-slate-950 border-slate-800 focus:border-slate-700 text-white' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-slate-900'
                    }`} 
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pipeline Stage</label>
                <select 
                  value={selectedLead.stage} 
                  onChange={e => {
                    const ns = e.target.value as Stage;
                    if (ns === 'won' || ns === 'lost') setFeedbackTarget({ leadId: selectedLead.id, targetStage: ns });
                    else updateLeadStage(selectedLead.id, ns, undefined);
                  }} 
                  className={`w-full text-sm border rounded-xl p-2.5 outline-none font-medium transition ${
                    uiMode === 'dark' ? 'bg-slate-950 border-slate-800 focus:border-slate-700 text-white' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-slate-900'
                  }`}
                >
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              {(selectedLead.stage === 'won' || selectedLead.stage === 'lost') && (
                <div className={`p-3 rounded-xl border ${selectedLead.stage === 'won' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Outcome Diagnostic Reason</span>
                  <p className="text-xs font-semibold mt-1">{selectedLead.outcomeReason || 'No descriptive reason logged'}</p>
                </div>
              )}

              {/* Activity Timeline sequence logger list component */}
              <div className={`border-t pt-6 mt-6 ${uiMode === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Timeline</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${uiMode === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>{selectedLead.activities?.length || 0} Logs</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { l: '📞 Call', type: 'call', n: 'Placed follow-up phone call', border: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' },
                    { l: '✉️ Email', type: 'email', n: 'Sent pitch deck proposal details', border: 'border-purple-500/20 bg-purple-500/10 text-purple-400' },
                    { l: '🤝 Demo', type: 'meeting', n: 'Completed software video demonstration', border: 'border-amber-500/20 bg-amber-500/10 text-amber-400' }
                  ].map((btn, bIdx) => (
                    <button 
                      key={bIdx} onClick={() => handleAddActivity(selectedLead.id, btn.type as any, btn.n)}
                      className={`text-[10px] font-bold py-1.5 rounded-lg border text-center transition ${btn.border} hover:opacity-80`}
                    >
                      {btn.l}
                    </button>
                  ))}
                </div>

                <div className={`space-y-4 pl-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 ${uiMode === 'dark' ? 'before:bg-slate-800' : 'before:bg-slate-100'}`}>
                  {selectedLead.activities && selectedLead.activities.length > 0 ? (
                    selectedLead.activities.map((act) => {
                      const bColor = act.type === 'call' ? 'bg-emerald-500' : act.type === 'email' ? 'bg-purple-500' : act.type === 'meeting' ? 'bg-amber-500' : 'bg-slate-400';
                      return (
                        <div key={act.id} className="flex gap-4 relative">
                          <div className={`w-3 h-3 rounded-full ${bColor} ring-4 ${uiMode === 'dark' ? 'ring-slate-900' : 'ring-white'} z-10 mt-1.5`} />
                          <div className={`flex-1 border p-2.5 rounded-xl ${uiMode === 'dark' ? 'bg-slate-950/60 border-slate-800/60' : 'bg-slate-50/60 border-slate-100/50'}`}>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold capitalize">{act.type}</span>
                              <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{act.note}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-[11px] text-slate-400">No logs captured yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className={`border-t pt-4 mt-6 ${uiMode === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <button onClick={() => handleDeleteLead(selectedLead.id)} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-3 rounded-xl text-sm font-semibold transition border border-rose-500/20">Delete Lead Permanently</button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}