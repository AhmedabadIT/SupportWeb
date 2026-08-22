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
import { INITIAL_ENGINEERS, INITIAL_TICKETS, INITIAL_VISITS } from './utils/initialData';
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
  // Theme State with localStorage persistence & system preference
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sync dark class to html document element and persist to localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('app_theme', 'light');
    }
  }, [darkMode]);

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
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const cached = localStorage.getItem('cached_tickets');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return INITIAL_TICKETS;
  });

  const [engineers, setEngineers] = useState<Engineer[]>(() => {
    try {
      const cached = localStorage.getItem('cached_engineers');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return INITIAL_ENGINEERS;
  });

  const [visits, setVisits] = useState<LocationVisit[]>(() => {
    try {
      const cached = localStorage.getItem('cached_visits');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return INITIAL_VISITS;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Derived systems data
  const systemTickets = React.useMemo(() => {
    const list = (tickets && tickets.length > 0) ? tickets : INITIAL_TICKETS;
    if (systemMode === 'Surat') {
      return list.filter(t => (t.ticket_id && t.ticket_id.toLowerCase().startsWith('sur-')) || (t.location && t.location.toLowerCase().includes('surat')));
    } else {
      return list.filter(t => !(t.ticket_id && t.ticket_id.toLowerCase().startsWith('sur-')) && !(t.location && t.location.toLowerCase().includes('surat')));
    }
  }, [tickets, systemMode]);

  const systemEngineers = React.useMemo(() => {
    const list = (engineers && engineers.length > 0) ? engineers : INITIAL_ENGINEERS;
    if (systemMode === 'Surat') {
      const suratList = list.filter(e => (e.location && e.location.toLowerCase().includes('surat')) || e.name === 'Mayur Ahir' || e.name === 'Jenil Kosambiya');
      return suratList.length > 0 ? suratList : list;
    } else {
      const roList = list.filter(e => !(e.location && e.location.toLowerCase().includes('surat')) && e.name !== 'Mayur Ahir' && e.name !== 'Jenil Kosambiya');
      return roList.length > 0 ? roList : list;
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

  // Fetch all initial data with automatic localStorage / initial data fallback
  const fetchData = async (isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
    }
    try {
      const [ticketsRes, engineersRes, visitsRes] = await Promise.all([
        fetch('/api/tickets').catch(() => null),
        fetch('/api/engineers').catch(() => null),
        fetch('/api/location-visits').catch(() => null)
      ]);

      let ticketsData: Ticket[] | null = null;
      let engineersData: Engineer[] | null = null;
      let visitsData: LocationVisit[] | null = null;

      if (ticketsRes && ticketsRes.ok) {
        try {
          ticketsData = await ticketsRes.json();
        } catch (e) {
          console.warn('Could not parse tickets JSON', e);
        }
      }

      if (engineersRes && engineersRes.ok) {
        try {
          engineersData = await engineersRes.json();
        } catch (e) {
          console.warn('Could not parse engineers JSON', e);
        }
      }

      if (visitsRes && visitsRes.ok) {
        try {
          visitsData = await visitsRes.json();
        } catch (e) {
          console.warn('Could not parse visits JSON', e);
        }
      }

      // Handle Tickets Sync
      if (ticketsData) {
        setTickets(ticketsData);
        localStorage.setItem('cached_tickets', JSON.stringify(ticketsData));
      } else {
        const cached = localStorage.getItem('cached_tickets');
        if (cached) {
          setTickets(JSON.parse(cached));
        } else {
          setTickets(INITIAL_TICKETS);
          localStorage.setItem('cached_tickets', JSON.stringify(INITIAL_TICKETS));
        }
      }

      // Handle Engineers Sync
      if (engineersData && engineersData.length > 0) {
        setEngineers(engineersData);
        localStorage.setItem('cached_engineers', JSON.stringify(engineersData));
      } else {
        const cached = localStorage.getItem('cached_engineers');
        if (cached) {
          setEngineers(JSON.parse(cached));
        } else {
          setEngineers(INITIAL_ENGINEERS);
          localStorage.setItem('cached_engineers', JSON.stringify(INITIAL_ENGINEERS));
        }
      }

      // Handle Visits Sync
      if (visitsData) {
        setVisits(visitsData);
        localStorage.setItem('cached_visits', JSON.stringify(visitsData));
      } else {
        const cached = localStorage.getItem('cached_visits');
        if (cached) {
          setVisits(JSON.parse(cached));
        } else {
          setVisits(INITIAL_VISITS);
          localStorage.setItem('cached_visits', JSON.stringify(INITIAL_VISITS));
        }
      }
    } catch (err: any) {
      console.error(err);
      // Graceful fallback from cache or initial seed
      const cachedEng = localStorage.getItem('cached_engineers');
      setEngineers(cachedEng ? JSON.parse(cachedEng) : INITIAL_ENGINEERS);
      const cachedT = localStorage.getItem('cached_tickets');
      setTickets(cachedT ? JSON.parse(cachedT) : INITIAL_TICKETS);
      const cachedV = localStorage.getItem('cached_visits');
      setVisits(cachedV ? JSON.parse(cachedV) : INITIAL_VISITS);
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

  // --- Database Operations with Offline & Static GitHub Pages Support ---

  // Helper to persist updated tickets state to cache
  const updateTicketsLocal = (newTickets: Ticket[]) => {
    setTickets(newTickets);
    localStorage.setItem('cached_tickets', JSON.stringify(newTickets));
  };

  // Helper to persist updated engineers state to cache
  const updateEngineersLocal = (newEngineers: Engineer[]) => {
    setEngineers(newEngineers);
    localStorage.setItem('cached_engineers', JSON.stringify(newEngineers));
  };

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
          const updatedList = tickets.map(t => t.id === duplicate.id ? { ...t, ...ticketData, updated_at: new Date().toISOString() } : t);
          updateTicketsLocal(updatedList);

          try {
            await fetch(`/api/tickets/${duplicate.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...ticketData, id: duplicate.id })
            });
          } catch (e) {
            console.log('Saved to local storage (static mode)');
          }

          setEditingTicket(null);
          return;
        } else {
          throw new Error(`Ticket number "${tid}" already exists.`);
        }
      }
    }

    if (isEditing) {
      const updatedList = tickets.map(t => t.id === ticketData.id ? { ...t, ...ticketData, updated_at: new Date().toISOString() } as Ticket : t);
      updateTicketsLocal(updatedList);
      try {
        await fetch(`/api/tickets/${ticketData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticketData)
        });
      } catch (e) {
        console.log('Saved to local storage');
      }
    } else {
      const newTicket: Ticket = {
        ...ticketData,
        id: 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        ticket_id: ticketData.ticket_id || `TID-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Ticket;
      const updatedList = [newTicket, ...tickets];
      updateTicketsLocal(updatedList);
      try {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticketData)
        });
      } catch (e) {
        console.log('Saved to local storage');
      }
    }

    setEditingTicket(null);
  };

  // Update specific fields of a ticket (for Engineer Status Updates)
  const handleUpdateTicket = async (id: string, updatedFields: Partial<Ticket>) => {
    const updatedList = tickets.map(t => t.id === id ? { ...t, ...updatedFields, updated_at: new Date().toISOString() } : t);
    updateTicketsLocal(updatedList);

    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
    } catch (e) {
      console.log('Updated in local storage');
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (id: string) => {
    const updatedList = tickets.filter(t => t.id !== id);
    updateTicketsLocal(updatedList);

    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.log('Deleted from local storage');
    }
  };

  // Delete All Tickets
  const handleDeleteAllTickets = async () => {
    updateTicketsLocal([]);

    try {
      await fetch('/api/tickets', {
        method: 'DELETE'
      });
    } catch (e) {
      console.log('Cleared local storage');
    }
  };

  // Bulk Import Tickets
  const handleBulkImport = async (importedTickets: Array<Partial<Ticket>>) => {
    const timestamp = Date.now();
    const mapped: Ticket[] = importedTickets.map((it, idx) => ({
      id: it.id || `imp-${timestamp}-${idx}`,
      ticket_id: it.ticket_id || `IMP-${idx + 1}`,
      date: it.date || new Date().toISOString().split('T')[0],
      username: it.username || 'N/A',
      contact: it.contact || 'N/A',
      location: it.location || 'N/A',
      product: it.product || 'AIO',
      category: it.category || 'Hardware',
      brand: it.brand || '',
      model: it.model || '',
      serial_number: it.serial_number || '',
      problem: it.problem || 'Hardware Issue',
      engineer: it.engineer || 'Unassigned',
      status: it.status || 'Open',
      action_taken: it.action_taken || '',
      first_visit_date: it.first_visit_date || '',
      hold_date: it.hold_date || '',
      close_date: it.close_date || '',
      engineer_remark: it.engineer_remark || '',
      resolution_days: it.resolution_days !== undefined ? it.resolution_days : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const combined = [...mapped, ...tickets];
    updateTicketsLocal(combined);

    try {
      await fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets: importedTickets })
      });
    } catch (e) {
      console.log('Imported tickets into local storage');
    }
  };

  // Create Engineer
  const handleCreateEngineer = async (fields: Partial<Engineer>) => {
    const newEngineer: Engineer = {
      id: 'eng-' + Date.now(),
      name: fields.name || 'New Engineer',
      mobile: fields.mobile || '',
      email: fields.email || '',
      password: fields.password || `${(fields.name || 'Eng').replace(/\s+/g, '')}@1234`,
      active: fields.active !== undefined ? fields.active : true,
      resigned: fields.resigned || false,
      resignation_date: fields.resignation_date || '',
      location: fields.location || 'Ro-Ahmedabad',
      address: fields.address || '',
      work_profile: fields.work_profile || 'System Support Engineer',
      education: fields.education || '',
      computer_certificate: fields.computer_certificate || '',
      experience: fields.experience || '',
      photo: fields.photo || ''
    };

    const updatedEngineers = [...engineers, newEngineer];
    updateEngineersLocal(updatedEngineers);

    try {
      await fetch('/api/engineers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
    } catch (e) {
      console.log('Saved engineer to local storage');
    }
  };

  // Update Engineer Details
  const handleUpdateEngineer = async (id: string, updatedFields: Partial<Engineer>) => {
    const updatedEngineers = engineers.map(eng => eng.id === id ? { ...eng, ...updatedFields } : eng);
    updateEngineersLocal(updatedEngineers);

    try {
      await fetch(`/api/engineers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
    } catch (e) {
      console.log('Updated engineer in local storage');
    }
  };

  // Delete Engineer profile
  const handleDeleteEngineer = async (id: string) => {
    const updatedEngineers = engineers.filter(eng => eng.id !== id);
    updateEngineersLocal(updatedEngineers);

    try {
      await fetch(`/api/engineers/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.log('Removed engineer from local storage');
    }
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
    <div className={`${darkMode ? 'dark' : ''} min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/60 text-slate-800'
    }`}>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Main Top Header Navbar (Sticky Top) */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md w-full max-w-full transition-colors duration-200 ${
        darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200/80'
      } shadow-xs`}>
        {/* Desktop Header Layout (md: and up) */}
        <div className="hidden md:flex items-center justify-between px-4 lg:px-6 py-2.5">
          {/* Left Side: Collapse Toggle + Full Horizontal Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label="Toggle navigation menu"
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 rotate-180" />}
            </button>
            
            <GurmystLogoHorizontal size={34} showTagline={true} />
          </div>

          {/* Right Side: Full Desk Switcher + Role Switcher + Theme Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Desk Location Switcher (Ahmedabad vs Surat) */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                id="sys-ro-ahmedabad-btn"
                onClick={() => {
                  setSystemMode('RO-Ahmedabad');
                  setEditingTicket(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  systemMode === 'RO-Ahmedabad'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Switch to Regional Office Ahmedabad"
              >
                <span>🏢</span>
                <span>RO Ahmedabad</span>
              </button>
              <button
                id="sys-surat-btn"
                onClick={() => {
                  setSystemMode('Surat');
                  setEditingTicket(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  systemMode === 'Surat'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Switch to Surat Branch"
              >
                <span>🌴</span>
                <span>Surat</span>
              </button>
            </div>

            {/* Quick Role Switcher (Admin vs Engineer) */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => { setRole('Admin'); setEditingTicket(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  role === 'Admin'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Helpdesk Admin View"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => { setRole('Engineer'); setEditingTicket(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  role === 'Engineer'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Field Engineer View"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Engineer</span>
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 cursor-pointer shrink-0"
              title="Toggle Dark / Light Mode"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Header Layout (md:hidden) */}
        <div className="flex md:hidden items-center justify-between px-2.5 py-2 w-full gap-1">
          {/* Left: Mobile Menu Toggle + Compact Brand */}
          <div className="flex items-center gap-1.5 shrink-0 min-w-0">
            <button 
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-1.5">
              <GurmystLogo size={24} className="shrink-0" />
              <div className="flex items-center font-black text-sm tracking-tight leading-none">
                <span className="text-red-600">G</span>
                <span className="text-slate-950 dark:text-white">UR</span>
                <span className="text-red-600">M</span>
                <span className="text-slate-950 dark:text-white">YST</span>
              </div>
            </div>
          </div>

          {/* Right: Compact Location Switch + Role Toggle + Theme */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile Desk Location Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg flex items-center border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold">
              <button
                onClick={() => { setSystemMode('RO-Ahmedabad'); setEditingTicket(null); }}
                className={`px-1.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-0.5 ${
                  systemMode === 'RO-Ahmedabad'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="RO Ahmedabad"
              >
                <span>🏢</span>
                <span>AMD</span>
              </button>
              <button
                onClick={() => { setSystemMode('Surat'); setEditingTicket(null); }}
                className={`px-1.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-0.5 ${
                  systemMode === 'Surat'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="Surat"
              >
                <span>🌴</span>
                <span>SUR</span>
              </button>
            </div>

            {/* Mobile Role Switch Button */}
            <button
              onClick={() => {
                setRole(role === 'Admin' ? 'Engineer' : 'Admin');
                setEditingTicket(null);
              }}
              className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                role === 'Admin'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-700'
                  : 'bg-indigo-600 text-white border-indigo-600'
              }`}
              title={`Switch Role (Current: ${role})`}
            >
              {role === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              <span>{role === 'Admin' ? 'Adm' : 'Eng'}</span>
            </button>

            {/* Mobile Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 cursor-pointer shrink-0"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Structural Grid Container */}
      <div className="flex relative w-full max-w-full">
        
        {/* Navigation Sidebar / Mobile Drawer */}
        <aside className={`fixed inset-y-0 left-0 z-50 md:z-30 border-r transition-all duration-300 transform md:sticky md:top-[57px] md:h-[calc(100vh-57px)] overflow-y-auto ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800'
        } ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          sidebarOpen ? 'translate-x-0 w-[290px] max-w-[85vw] shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-4 space-y-4 pb-28 md:pb-6">
            
            {/* Mobile Drawer Dedicated Header Bar */}
            <div className="flex md:hidden items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GurmystLogo size={24} className="shrink-0" />
                <div className="flex items-center font-black text-sm tracking-tight leading-none">
                  <span className="text-red-600">G</span>
                  <span className="text-slate-950 dark:text-white">UR</span>
                  <span className="text-red-600">M</span>
                  <span className="text-slate-950 dark:text-white">YST</span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title="Close Drawer"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Active User Label Card */}
            <div className={`rounded-xl border flex items-center bg-gradient-to-br transition-all ${
              darkMode ? 'from-slate-800/60 to-slate-900/60 border-slate-700/50' : 'from-slate-50 to-slate-100/50 border-slate-200/60'
            } ${
              sidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-3'
            }`} title={sidebarCollapsed ? (role === 'Admin' ? 'Helpdesk Admin' : 'Field Engineer') : undefined}>
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm uppercase shadow-sm shrink-0">
                {role === 'Admin' ? 'A' : 'E'}
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {role === 'Admin' ? 'Helpdesk Admin' : 'Field Engineer'}
                  </h4>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">{role} View</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{systemMode}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Quick Config Switches (visible in open drawer on mobile) */}
            <div className="md:hidden space-y-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Branch Helpdesk</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { setSystemMode('RO-Ahmedabad'); setEditingTicket(null); }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    systemMode === 'RO-Ahmedabad' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>🏢</span>
                  <span>Ahmedabad</span>
                </button>
                <button
                  onClick={() => { setSystemMode('Surat'); setEditingTicket(null); }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    systemMode === 'Surat' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>🌴</span>
                  <span>Surat</span>
                </button>
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pt-1">User Role</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { setRole('Admin'); setEditingTicket(null); }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    role === 'Admin' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => { setRole('Engineer'); setEditingTicket(null); }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    role === 'Engineer' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Engineer</span>
                </button>
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pt-1">Theme</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setDarkMode(false)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    !darkMode ? 'bg-amber-500 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                </button>
                <button
                  onClick={() => setDarkMode(true)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    darkMode ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
              </div>
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
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-fade-in">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Need Support?</span>
                <div className="p-2.5 bg-indigo-50/40 border border-indigo-50/50 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold block text-indigo-600 dark:text-indigo-400 mb-0.5">Helpdesk Quick Keys</span>
                  <p className="leading-relaxed">Press Parse to automatically run WhatsApp text through the Gemini language model modelTurn engine.</p>
                </div>
              </div>
            )}
 
            {/* Gurmyst Brand Circular Logo */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
              <GurmystLogo size={sidebarCollapsed ? 36 : 76} className="text-slate-900 dark:text-white transition-all duration-300" />
            </div>

          </div>
        </aside>

        {/* Sidebar Backdrop Overlay (Mobile) */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
            aria-label="Close menu overlay"
          />
        )}

        {/* Main Workspace Stage Content Panel */}
        <main className="flex-1 p-3 sm:p-5 md:p-8 pb-24 md:pb-8 overflow-x-hidden min-h-[calc(100vh-65px)]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens < md) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-lg ${
        darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        {role === 'Admin' ? (
          <>
            <button
              onClick={() => { setActiveAdminTab('Dashboard'); setEditingTicket(null); }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
                activeAdminTab === 'Dashboard' && !editingTicket
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Overview</span>
            </button>

            <button
              onClick={() => { setActiveAdminTab('LiveTracker'); setEditingTicket(null); }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
                activeAdminTab === 'LiveTracker' && !editingTicket
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <Navigation className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] mt-0.5">Radar</span>
            </button>

            <button
              onClick={() => { setActiveAdminTab('CreateTicket'); setEditingTicket(null); }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
                activeAdminTab === 'CreateTicket'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <PlusCircle className="w-5 h-5 text-indigo-500" />
              <span className="text-[10px] mt-0.5">Create</span>
            </button>

            <button
              onClick={() => { 
                setActiveAdminTab('TicketsList'); 
                setEditingTicket(null);
                setInitialStatusFilter('all');
                setInitialDateFilter('all');
              }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
                activeAdminTab === 'TicketsList' && !editingTicket
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <ListTodo className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Tickets</span>
            </button>

            <button
              onClick={() => toggleSidebar()}
              className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 font-medium cursor-pointer min-w-[54px]"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">More</span>
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full px-4 py-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                E
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Field Engineer View
              </span>
            </div>
            <button
              onClick={() => { setRole('Admin'); }}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Switch to Admin
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
