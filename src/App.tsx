import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Engineer, 
  ViewRole, 
  AdminTab,
  LocationVisit 
} from './types';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AdminDashboard } from './components/AdminDashboard';
import { CreateTicketForm } from './components/CreateTicketForm';
import { TicketsTable } from './components/TicketsTable';
import { EngineersManager } from './components/EngineersManager';
import { EngineerDashboardView } from './components/EngineerDashboardView';
import { AttendanceManager } from './components/AttendanceManager';
import { AdminSwiggyTracker } from './components/AdminSwiggyTracker';
import { GurmystLogo, GurmystLogoHorizontal } from './components/GurmystLogo';
import { 
  Users, 
  Layers, 
  PlusCircle, 
  ListTodo, 
  LayoutDashboard, 
  Settings, 
  HelpCircle, 
  Menu, 
  X, 
  ChevronRight, 
  Sun, 
  Moon, 
  FileText,
  Clock,
  ShieldCheck,
  Briefcase,
  Calendar,
  Navigation,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // System Mode State (RO-Ahmedabad vs Surat separate helpdesks)
  const [systemMode, setSystemMode] = useState<'RO-Ahmedabad' | 'Surat'>('RO-Ahmedabad');

  // App Role & Navigation State
  const [role, setRole] = useState<ViewRole>('Admin');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Navigation KPI filter pass-through states
  const [initialStatusFilter, setInitialStatusFilter] = useState<string>('all');
  const [initialDateFilter, setInitialDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  // Database Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [visits, setVisits] = useState<LocationVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derived systems data
  const systemTickets = React.useMemo(() => {
    if (systemMode === 'Surat') {
      return tickets.filter(t => (t.ticket_id && t.ticket_id.toLowerCase().startsWith('sur-')) || (t.location && t.location.toLowerCase().includes('surat')));
    } else {
      return tickets.filter(t => !(t.ticket_id && t.ticket_id.toLowerCase().startsWith('sur-')) && !(t.location && t.location.toLowerCase().includes('surat')));
    }
  }, [tickets, systemMode]);

  const systemEngineers = React.useMemo(() => {
    if (systemMode === 'Surat') {
      return engineers.filter(e => (e.location && e.location.toLowerCase().includes('surat')) || e.name === 'Mayur Ahir' || e.name === 'Jenil Kosambiya');
    } else {
      return engineers.filter(e => !(e.location && e.location.toLowerCase().includes('surat')) && e.name !== 'Mayur Ahir' && e.name !== 'Jenil Kosambiya');
    }
  }, [engineers, systemMode]);

  // Editing state for Tickets
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch all initial data
  const fetchData = async (isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
    }
    try {
      const [ticketsRes, engineersRes, visitsRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/engineers'),
        fetch('/api/location-visits')
      ]);

      if (!ticketsRes.ok || !engineersRes.ok) {
        throw new Error('Failed to retrieve database records');
      }

      const ticketsData = await ticketsRes.json();
      const engineersData = await engineersRes.json();
      const visitsData = visitsRes.ok ? await visitsRes.json() : [];

      setTickets(ticketsData);
      setEngineers(engineersData);
      setVisits(visitsData);
    } catch (err: any) {
      console.error(err);
      if (!isSilent) {
        showToast(err.message || 'Error communicating with helpdesk server', 'error');
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();

    // Silent background polling every 60 seconds to auto-refresh ticket log lists
    const interval = setInterval(() => {
      fetchData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // --- Database Operations ---

  // Create or Update Ticket
  const handleSaveTicket = async (ticketData: Omit<Ticket, 'id' | 'ticket_id' | 'created_at' | 'updated_at'> & { id?: string; ticket_id?: string }) => {
    const isEditing = !!ticketData.id;
    const tid = ticketData.ticket_id?.trim();

    if (tid) {
      const duplicate = tickets.find(t => 
        t.ticket_id.trim().toLowerCase() === tid.toLowerCase() && 
        (!isEditing || t.id !== ticketData.id)
      );
      if (duplicate) {
        if (duplicate.status !== ticketData.status) {
          // Status has changed! Automatically update the existing record with the new data
          const response = await fetch(`/api/tickets/${duplicate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...ticketData, id: duplicate.id })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to update existing duplicate ticket');
          }

          await fetchData();
          setEditingTicket(null);
          return;
        } else {
          throw new Error(`Ticket number "${tid}" already exists.`);
        }
      }
    }

    const url = isEditing ? `/api/tickets/${ticketData.id}` : '/api/tickets';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to save ticket details');
    }

    // Refresh tickets
    await fetchData();
    setEditingTicket(null);
  };

  // Update specific fields of a ticket (for Engineer Status Updates)
  const handleUpdateTicket = async (id: string, updatedFields: Partial<Ticket>) => {
    const response = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to update ticket details');
    }

    await fetchData();
  };

  // Delete Ticket
  const handleDeleteTicket = async (id: string) => {
    const response = await fetch(`/api/tickets/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to delete ticket record');
    }

    await fetchData();
  };

  // Delete All Tickets
  const handleDeleteAllTickets = async () => {
    const response = await fetch('/api/tickets', {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to clear all ticket logs');
    }

    await fetchData();
  };

  // Bulk Import Tickets
  const handleBulkImport = async (importedTickets: Array<Partial<Ticket>>) => {
    const response = await fetch('/api/tickets/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickets: importedTickets })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to import tickets');
    }

    await fetchData();
  };

  // Create Engineer
  const handleCreateEngineer = async (fields: Partial<Engineer>) => {
    const response = await fetch('/api/engineers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to register engineer profile');
    }

    await fetchData();
  };

  // Update Engineer Details
  const handleUpdateEngineer = async (id: string, updatedFields: Partial<Engineer>) => {
    const response = await fetch(`/api/engineers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to update engineer details');
    }

    await fetchData();
  };

  // Delete Engineer profile
  const handleDeleteEngineer = async (id: string) => {
    const response = await fetch(`/api/engineers/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to remove engineer');
    }

    await fetchData();
  };

  // Handler to quickly trigger edit mode on a ticket
  const startEditingTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setActiveAdminTab('CreateTicket');
  };

  // Sidebar Tabs Config
  const adminTabsList = [
    { id: 'Dashboard', label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'LiveTracker', label: '🛵 Live Field Radar', icon: <Navigation className="w-4 h-4 text-emerald-500" /> },
    { id: 'CreateTicket', label: 'Parse & Generate', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'TicketsList', label: 'All Tickets Logs', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'ManageEngineers', label: 'Engineers Roster', icon: <Users className="w-4 h-4" /> },
    { id: 'Attendance', label: 'Attendance Board', icon: <Calendar className="w-4 h-4" /> }
  ] as const;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/60 text-slate-800'
    }`}>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Main Top Header Navbar */}
      <header className={`sticky top-0 z-40 border-b flex items-center justify-between px-6 py-4 backdrop-blur-md ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'
      } shadow-sm`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <GurmystLogoHorizontal size={36} />
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-4 flex-wrap">
          
          {/* Desk Location Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50 dark:border-slate-700/60">
            <button
              id="sys-ro-ahmedabad-btn"
              onClick={() => {
                setSystemMode('RO-Ahmedabad');
                setEditingTicket(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                systemMode === 'RO-Ahmedabad'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              🏢 RO Ahmedabad
            </button>
            <button
              id="sys-surat-btn"
              onClick={() => {
                setSystemMode('Surat');
                setEditingTicket(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                systemMode === 'Surat'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              🌴 Surat
            </button>
          </div>

          {/* Quick Role Toggle Option */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50 dark:border-slate-700/60">
            <button
              onClick={() => { setRole('Admin'); setEditingTicket(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                role === 'Admin'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </button>
            <button
              onClick={() => { setRole('Engineer'); setEditingTicket(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                role === 'Engineer'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Engineer Portal
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400"
            title="Toggle Dark / Light Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

        </div>
      </header>

      {/* Main Structural Grid Container */}
      <div className="flex relative">
        
        {/* Left Navigation Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-30 border-r p-4 transition-all duration-300 transform md:sticky md:top-[73px] md:h-[calc(100vh-73px)] ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200/60 text-slate-800'
        } ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="space-y-6">
            
            {/* Active User Label Card */}
            <div className={`rounded-xl border flex items-center bg-gradient-to-br ${
              darkMode ? 'from-slate-800/60 to-slate-900/60 border-slate-700/50' : 'from-slate-50 to-slate-100/50 border-slate-200/60'
            } ${
              sidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-4'
            }`} title={sidebarCollapsed ? (role === 'Admin' ? 'Helpdesk Admin' : 'Field Engineer') : undefined}>
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm uppercase shadow-sm shrink-0">
                {role === 'Admin' ? 'A' : 'E'}
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {role === 'Admin' ? 'Helpdesk Admin' : 'Field Engineer'}
                  </h4>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">{role} View</span>
                </div>
              )}
            </div>
 
            {/* Nav Menu Lists depending on role */}
            <div className="space-y-1.5">
              {!sidebarCollapsed && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Navigation Menu</span>}
              
              {role === 'Admin' ? (
                adminTabsList.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveAdminTab(tab.id);
                      setSidebarOpen(false);
                      if (tab.id !== 'CreateTicket') setEditingTicket(null);
                      if (tab.id === 'TicketsList') {
                        setInitialStatusFilter('all');
                        setInitialDateFilter('all');
                      }
                    }}
                    className={`w-full flex items-center rounded-xl text-xs font-bold transition-all ${
                      sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                    } ${
                      activeAdminTab === tab.id && !editingTicket
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={sidebarCollapsed ? tab.label : undefined}
                  >
                    <span className="shrink-0">{tab.icon}</span>
                    {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
                  </button>
                ))
              ) : (
                <button
                  className={`w-full flex items-center rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs ${
                    sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                  }`}
                  title={sidebarCollapsed ? "My Assigned Portal" : undefined}
                >
                  <span className="shrink-0"><LayoutDashboard className="w-4 h-4" /></span>
                  {!sidebarCollapsed && <span className="truncate">My Assigned Portal</span>}
                </button>
              )}
 
              {editingTicket && (
                <button
                  onClick={() => setActiveAdminTab('CreateTicket')}
                  className={`w-full flex items-center rounded-xl text-xs font-bold bg-amber-500 text-white shadow-xs ${
                    sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                  }`}
                  title={sidebarCollapsed ? `Editing Ticket: ${editingTicket.ticket_id}` : undefined}
                >
                  <span className="shrink-0"><PlusCircle className="w-4 h-4" /></span>
                  {!sidebarCollapsed && <span className="truncate">Editing Ticket: {editingTicket.ticket_id}</span>}
                </button>
              )}
            </div>
 
            {/* Static help widget */}
            {!sidebarCollapsed && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-fade-in">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Need Support?</span>
                <div className="p-3 bg-indigo-50/40 border border-indigo-50/50 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold block text-indigo-600 dark:text-indigo-400 mb-0.5">Helpdesk Quick Keys</span>
                  <p className="leading-relaxed">Press Parse to automatically run WhatsApp text through the Gemini language model modelTurn engine.</p>
                </div>
              </div>
            )}
 
            {/* Gurmyst Brand Circular Logo */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
              <GurmystLogo size={sidebarCollapsed ? 40 : 120} className="text-slate-900 dark:text-white transition-all duration-300" />
            </div>
 
          </div>
        </aside>

        {/* Sidebar Overlay (Mobile) */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-xs"
          />
        )}

        {/* Main Workspace Stage Content Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden min-h-[calc(100vh-73px)]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-500">Contacting service desk database...</p>
              </div>
            ) : (
              <motion.div
                key={role + (role === 'Admin' ? activeAdminTab : 'EngineerPortal')}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                {role === 'Admin' ? (
                  <>
                    {activeAdminTab === 'Dashboard' && (
                      <AdminDashboard 
                        tickets={systemTickets} 
                        engineers={systemEngineers} 
                        onNavigateToTab={setActiveAdminTab}
                        onEditTicket={startEditingTicket}
                        onKpiClick={(status, date) => {
                          setInitialStatusFilter(status);
                          setInitialDateFilter(date);
                          setActiveAdminTab('TicketsList');
                        }}
                      />
                    )}
                    {activeAdminTab === 'CreateTicket' && (
                      <CreateTicketForm
                        engineers={systemEngineers}
                        editingTicket={editingTicket}
                        onSaveTicket={handleSaveTicket}
                        onCancelEdit={() => { setEditingTicket(null); setActiveAdminTab('Dashboard'); }}
                        showToast={showToast}
                        systemMode={systemMode}
                        isAdmin={true}
                      />
                    )}
                    {activeAdminTab === 'TicketsList' && (
                      <TicketsTable
                        tickets={systemTickets}
                        engineers={systemEngineers}
                        onEditTicket={startEditingTicket}
                        onDeleteTicket={handleDeleteTicket}
                        onImportTickets={handleBulkImport}
                        showToast={showToast}
                        onDeleteAllTickets={handleDeleteAllTickets}
                        initialStatusFilter={initialStatusFilter}
                        initialDateFilter={initialDateFilter}
                      />
                    )}
                    {activeAdminTab === 'ManageEngineers' && (
                      <EngineersManager
                        engineers={engineers}
                        onCreateEngineer={handleCreateEngineer}
                        onUpdateEngineer={handleUpdateEngineer}
                        onDeleteEngineer={handleDeleteEngineer}
                        showToast={showToast}
                      />
                    )}
                    {activeAdminTab === 'LiveTracker' && (
                      <AdminSwiggyTracker
                        engineers={systemEngineers}
                        visits={visits}
                        onRefreshVisits={fetchData}
                      />
                    )}
                    {activeAdminTab === 'Attendance' && (
                      <AttendanceManager
                        engineers={engineers}
                        showToast={showToast}
                        systemMode={systemMode}
                      />
                    )}
                  </>
                ) : (
                  <EngineerDashboardView
                    tickets={systemTickets}
                    engineers={systemEngineers}
                    onUpdateTicket={handleUpdateTicket}
                    onSaveTicket={handleSaveTicket}
                    showToast={showToast}
                    systemMode={systemMode}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
