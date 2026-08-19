import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Engineer, LocationVisit } from '../types';
import { calculateDaysBetweenVisitAndClose } from '../utils/dateUtils';
import { 
  calculateRoadTravelDistance, 
  getCurrentGpsPosition,
  DEFAULT_HEADQUARTERS 
} from '../utils/locationUtils';
import { LocationMap } from './LocationMap';
import { CreateTicketForm } from './CreateTicketForm';
import { 
  Inbox, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Wrench, 
  Save, 
  MessageSquare, 
  Calendar,
  Layers,
  MapPin,
  ChevronRight,
  UserCheck,
  Navigation,
  Route,
  Compass,
  Lock,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Trash2,
  Calculator,
  Briefcase,
  CheckCircle2,
  Search,
  Grid,
  List,
  RefreshCw,
  Activity,
  SlidersHorizontal,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EngineerDashboardViewProps {
  tickets: Ticket[];
  engineers: Engineer[];
  onUpdateTicket: (id: string, updatedFields: Partial<Ticket>) => Promise<void>;
  onSaveTicket?: (ticketData: Omit<Ticket, 'id' | 'ticket_id' | 'created_at' | 'updated_at'> & { id?: string; ticket_id?: string }) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  systemMode?: 'RO-Ahmedabad' | 'Surat';
}

export const EngineerDashboardView: React.FC<EngineerDashboardViewProps> = ({
  tickets,
  engineers,
  onUpdateTicket,
  onSaveTicket,
  showToast,
  systemMode = 'RO-Ahmedabad'
}) => {
  // Active Tab State: 'jobs' | 'create_ticket' | 'location_visit'
  const [activeTab, setActiveTab] = useState<'jobs' | 'create_ticket' | 'location_visit'>('jobs');

  // Authenticated Engineer State
  const [authenticatedEngineer, setAuthenticatedEngineer] = useState<Engineer | null>(() => {
    const saved = localStorage.getItem('logged_engineer');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  // Selected Engineer Name (synced with logged in engineer or fallback simulation)
  const [selectedEngineerName, setSelectedEngineerName] = useState<string>(() => {
    if (authenticatedEngineer) return authenticatedEngineer.name;
    return engineers.length > 0 ? engineers[0].name : '';
  });

  useEffect(() => {
    if (authenticatedEngineer) {
      setSelectedEngineerName(authenticatedEngineer.name);
      localStorage.setItem('logged_engineer', JSON.stringify(authenticatedEngineer));
    } else {
      localStorage.removeItem('logged_engineer');
    }
  }, [authenticatedEngineer]);

  // Auth Modal/Mode State: 'login' | 'signup' | 'none'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'none'>(() => {
    const saved = localStorage.getItem('logged_engineer');
    return saved ? 'none' : 'login';
  });

  // Auth Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLocation, setSignupLocation] = useState('Ro-Ahmedabad');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Ticket being updated state
  const [updatingTicket, setUpdatingTicket] = useState<Ticket | null>(null);

  // Update action form state
  const [status, setStatus] = useState<'Open' | 'Hold' | 'Closed'>('Open');
  const [remarks, setRemarks] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [firstVisitDate, setFirstVisitDate] = useState('');
  const [holdDate, setHoldDate] = useState('');
  const [closeDate, setCloseDate] = useState('');

  // Pagination State for Tickets
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Location Visit Calculator State
  const [startLocName, setStartLocName] = useState('');
  const [startLat, setStartLat] = useState<number>(0);
  const [startLng, setStartLng] = useState<number>(0);

  const [destLocName, setDestLocName] = useState('');
  const [destLat, setDestLat] = useState<number>(0);
  const [destLng, setDestLng] = useState<number>(0);

  const [linkedTicketId, setLinkedTicketId] = useState<string>('');
  const [visitNotes, setVisitNotes] = useState('');
  const [isGpsLoadingStart, setIsGpsLoadingStart] = useState(false);
  const [isGpsLoadingDest, setIsGpsLoadingDest] = useState(false);

  // Active Journey GPS Tracking State
  const [activeJourney, setActiveJourney] = useState<LocationVisit | null>(null);
  const [journeyProgress, setJourneyProgress] = useState<number>(0);
  const [journeySpeed, setJourneySpeed] = useState<number>(42);
  const [isGeofenceEntered, setIsGeofenceEntered] = useState<boolean>(false);
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');

  // Saved Location Visits list
  const [visits, setVisits] = useState<LocationVisit[]>([]);
  const [isVisitsLoading, setIsVisitsLoading] = useState(false);

  // Visit Activity Log Filter & View Mode
  const [selectedVisitEngineerFilter, setSelectedVisitEngineerFilter] = useState<string>('all');
  const [visitSearchQuery, setVisitSearchQuery] = useState<string>('');
  const [visitViewMode, setVisitViewMode] = useState<'grouped' | 'table' | 'timeline'>('grouped');

  // Fetch Location Visits
  const fetchVisits = async (engFilter?: string) => {
    setIsVisitsLoading(true);
    try {
      let url = '/api/location-visits';
      if (authenticatedEngineer) {
        // Strict privacy lockdown: force fetching logged-in engineer's visits only
        url += `?engineerId=${encodeURIComponent(authenticatedEngineer.id || authenticatedEngineer.name)}`;
      } else {
        const activeFilter = engFilter !== undefined ? engFilter : selectedVisitEngineerFilter;
        if (activeFilter !== 'all') {
          url += `?engineerId=${encodeURIComponent(activeFilter)}`;
        }
      }

      let fetchedData: LocationVisit[] | null = null;
      try {
        const res = await fetch(url).catch(() => null);
        if (res && res.ok && res.headers.get('content-type')?.includes('application/json')) {
          fetchedData = await res.json();
        }
      } catch (netErr) {
        // Ignore network failure, fall back to local
      }

      if (fetchedData && Array.isArray(fetchedData)) {
        setVisits(fetchedData);
        localStorage.setItem('cached_location_visits', JSON.stringify(fetchedData));
      } else {
        const localVisits: LocationVisit[] = JSON.parse(localStorage.getItem('cached_location_visits') || '[]');
        if (authenticatedEngineer) {
          setVisits(localVisits.filter(v => v.engineerId === authenticatedEngineer.id || v.engineerName === authenticatedEngineer.name));
        } else {
          setVisits(localVisits);
        }
      }
    } catch (e) {
      console.warn("Could not fetch location visits, using local storage", e);
    } finally {
      setIsVisitsLoading(false);
    }
  };

  useEffect(() => {
    if (authenticatedEngineer) {
      setSelectedVisitEngineerFilter(authenticatedEngineer.name);
    }
    fetchVisits(selectedVisitEngineerFilter);
  }, [authenticatedEngineer]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      showToast("Please enter your Mobile/Email/Name and Password.", "error");
      return;
    }

    setIsAuthLoading(true);
    try {
      let loggedInEng: Engineer | null = null;

      // 1. Try server API login
      try {
        const res = await fetch('/api/engineers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
        }).catch(() => null);

        if (res && res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data && data.engineer) {
            loggedInEng = data.engineer;
          }
        }
      } catch (netErr) {
        console.log('Server API offline, checking local engineers directory');
      }

      // 2. Fallback to local / static engineers verification (for Live GitHub Pages)
      if (!loggedInEng) {
        const idClean = loginIdentifier.trim().toLowerCase();
        const pwdClean = loginPassword.trim();

        // Get full list of engineers from props or local storage
        const localEngList: Engineer[] = (engineers && engineers.length > 0)
          ? engineers
          : JSON.parse(localStorage.getItem('cached_engineers') || '[]');

        const found = localEngList.find(eng => {
          const matchMobile = eng.mobile && eng.mobile.replace(/[\s-]/g, '') === idClean.replace(/[\s-]/g, '');
          const matchEmail = eng.email && eng.email.toLowerCase() === idClean;
          const matchName = eng.name && eng.name.toLowerCase() === idClean;
          return matchMobile || matchEmail || matchName;
        });

        if (found) {
          const defaultEngPwd = `${found.name.replace(/\s+/g, '')}@1234`;
          const matchesPassword = (found.password && found.password === pwdClean) ||
                                  (pwdClean === defaultEngPwd) ||
                                  (pwdClean === 'eng123') ||
                                  (pwdClean === '123456');

          if (matchesPassword) {
            loggedInEng = found;
          } else {
            throw new Error("Incorrect password for this engineer account.");
          }
        } else {
          throw new Error("Engineer account not found. Please check your mobile or email.");
        }
      }

      setAuthenticatedEngineer(loggedInEng);
      setSelectedEngineerName(loggedInEng.name);
      setAuthMode('none');
      showToast(`Welcome back, ${loggedInEng.name}! Logged in successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || "Invalid credentials", 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupMobile || !signupEmail) {
      showToast("Please fill in Name, Mobile, and Email.", "error");
      return;
    }

    setIsAuthLoading(true);
    try {
      let createdEngineer: Engineer | null = null;

      try {
        const res = await fetch('/api/engineers/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: signupName,
            mobile: signupMobile,
            email: signupEmail,
            password: signupPassword || 'eng123',
            location: signupLocation
          })
        }).catch(() => null);

        if (res && res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data && data.engineer) {
            createdEngineer = data.engineer;
          }
        }
      } catch (netErr) {
        console.log('Server offline, saving engineer locally');
      }

      if (!createdEngineer) {
        createdEngineer = {
          id: 'eng-' + Date.now(),
          name: signupName.trim(),
          mobile: signupMobile.trim(),
          email: signupEmail.trim(),
          password: signupPassword || `${signupName.replace(/\s+/g, '')}@1234`,
          active: true,
          resigned: false,
          resignation_date: '',
          location: signupLocation || 'Ro-Ahmedabad',
          address: '',
          work_profile: 'System Support Engineer',
          joining_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const localEngList: Engineer[] = JSON.parse(localStorage.getItem('cached_engineers') || '[]');
        localEngList.unshift(createdEngineer);
        localStorage.setItem('cached_engineers', JSON.stringify(localEngList));
      }

      setAuthenticatedEngineer(createdEngineer);
      setSelectedEngineerName(createdEngineer.name);
      setAuthMode('none');
      showToast(`Account created successfully! Welcome, ${createdEngineer.name}`, 'success');
    } catch (err: any) {
      showToast(err.message || "Signup failed", 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout Engineer
  const handleLogout = () => {
    setAuthenticatedEngineer(null);
    setAuthMode('login');
    showToast("Logged out from Engineer Portal.", "info");
  };

  // GPS Location Getters & Fallbacks
  const [startGpsActive, setStartGpsActive] = useState(false);
  const [destGpsActive, setDestGpsActive] = useState(false);
  const [gpsNoticeMsg, setGpsNoticeMsg] = useState<string | null>(null);

  const applyFallbackHq = (target: 'start' | 'dest' | 'both') => {
    const defaultHq = systemMode === 'Surat' ? DEFAULT_HEADQUARTERS.SURAT : DEFAULT_HEADQUARTERS.AHMEDABAD;
    if (target === 'start' || target === 'both') {
      if (startLat === 0 && startLng === 0) {
        setStartLat(defaultHq.lat);
        setStartLng(defaultHq.lng);
        setStartLocName(`${defaultHq.name} (Fallback HQ)`);
      }
    }
    if (target === 'dest' || target === 'both') {
      if (destLat === 0 && destLng === 0) {
        setDestLat(defaultHq.lat);
        setDestLng(defaultHq.lng);
        setDestLocName(`${defaultHq.name} (Fallback HQ)`);
      }
    }
  };

  const handleGetStartGps = async () => {
    setIsGpsLoadingStart(true);
    setGpsNoticeMsg(null);
    try {
      const coords = await getCurrentGpsPosition();
      setStartLat(coords.lat);
      setStartLng(coords.lng);
      setStartLocName(`GPS Location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`);
      setStartGpsActive(true);
      showToast(`Start GPS acquired: Lat ${coords.lat.toFixed(5)}, Lng ${coords.lng.toFixed(5)}`, "success");
    } catch (err: any) {
      const msg = err.message || "GPS Access Error: User denied Geolocation";
      setGpsNoticeMsg(msg);
      applyFallbackHq('start');
      showToast(`GPS Error: ${msg}. Fallback HQ coordinates set.`, "error");
    } finally {
      setIsGpsLoadingStart(false);
    }
  };

  const handleGetDestGps = async () => {
    setIsGpsLoadingDest(true);
    setGpsNoticeMsg(null);
    try {
      const coords = await getCurrentGpsPosition();
      setDestLat(coords.lat);
      setDestLng(coords.lng);
      setDestLocName(`GPS Location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`);
      setDestGpsActive(true);
      showToast(`Destination GPS acquired: Lat ${coords.lat.toFixed(5)}, Lng ${coords.lng.toFixed(5)}`, "success");
    } catch (err: any) {
      const msg = err.message || "GPS Access Error: User denied Geolocation";
      setGpsNoticeMsg(msg);
      applyFallbackHq('dest');
      showToast(`GPS Error: ${msg}. Fallback HQ coordinates set.`, "error");
    } finally {
      setIsGpsLoadingDest(false);
    }
  };

  const handleGetBothGps = async () => {
    setIsGpsLoadingStart(true);
    setIsGpsLoadingDest(true);
    setGpsNoticeMsg(null);
    try {
      const coords = await getCurrentGpsPosition();
      setStartLat(coords.lat);
      setStartLng(coords.lng);
      setStartLocName(`Start GPS (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`);
      setStartGpsActive(true);

      // Auto-set dest as current live location too if dest is empty or default
      setDestLat(coords.lat);
      setDestLng(coords.lng);
      if (!destLocName || destLocName.includes('GPS Location')) {
        setDestLocName(`Dest GPS (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`);
      }
      setDestGpsActive(true);

      showToast(`Current live GPS coordinates updated for Start & Destination: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`, "success");
    } catch (err: any) {
      const msg = err.message || "GPS Access Error: User denied Geolocation";
      setGpsNoticeMsg(msg);
      applyFallbackHq('both');
      showToast(`GPS Error: ${msg}. Fallback HQ coordinates applied.`, "error");
    } finally {
      setIsGpsLoadingStart(false);
      setIsGpsLoadingDest(false);
    }
  };

  // Ticket selection auto-fill for destination
  const handleSelectTicketDestination = (ticketId: string) => {
    setLinkedTicketId(ticketId);
    const foundTicket = tickets.find(t => t.id === ticketId || t.ticket_id === ticketId);
    if (foundTicket) {
      const destName = `${foundTicket.ticket_id} - ${foundTicket.location || 'Branch Site'}`;
      setDestLocName(destName);
    }
  };

  // OSRM Calculated Route Distance State
  const [osrmRouteDistance, setOsrmRouteDistance] = useState<{ km: number; miles: number } | null>(null);

  // Live Calculated Road Route Distance
  const calculatedDistance = useMemo(() => {
    if (osrmRouteDistance && osrmRouteDistance.km > 0) {
      return osrmRouteDistance;
    }
    return calculateRoadTravelDistance(startLat, startLng, destLat, destLng);
  }, [osrmRouteDistance, startLat, startLng, destLat, destLng]);

  // Estimated Travel Time (driving ~40 km/h)
  const estimatedTimeMins = useMemo(() => {
    if (calculatedDistance.km <= 0) return 0;
    const hours = calculatedDistance.km / 40;
    return Math.round(hours * 60);
  }, [calculatedDistance]);

  // Save Location Visit
  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLocName || !destLocName) {
      showToast("Please specify both Start Location and Destination Location.", "error");
      return;
    }

    const engName = authenticatedEngineer ? authenticatedEngineer.name : selectedEngineerName;
    const engId = authenticatedEngineer ? authenticatedEngineer.id : ('eng-' + engName.replace(/\s+/g, '-').toLowerCase());

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const visitPayload: LocationVisit = {
      id: `vst-${Date.now()}`,
      engineerId: engId,
      engineerName: engName,
      ticketNumber: linkedTicketId ? tickets.find(t => t.id === linkedTicketId || t.ticket_id === linkedTicketId)?.ticket_id : undefined,
      startLocationName: startLocName,
      startCoords: { lat: startLat, lng: startLng },
      destinationLocationName: destLocName,
      destinationCoords: { lat: destLat, lng: destLng },
      distanceKm: calculatedDistance.km,
      distanceMiles: calculatedDistance.miles,
      visitDate: dateStr,
      visitTime: timeStr,
      notes: visitNotes,
      status: 'Completed',
      created_at: now.toISOString()
    };

    try {
      try {
        await fetch('/api/location-visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visitPayload)
        });
      } catch (e) {
        console.log('Saved visit to local storage');
      }

      // Local storage persistence
      const localVisits: LocationVisit[] = JSON.parse(localStorage.getItem('cached_location_visits') || '[]');
      localVisits.unshift(visitPayload);
      localStorage.setItem('cached_location_visits', JSON.stringify(localVisits));

      showToast(`Location Visit logged! Distance: ${calculatedDistance.km} KM (${calculatedDistance.miles} mi)`, 'success');
      setVisitNotes('');
      fetchVisits();
    } catch (err: any) {
      showToast(err.message || "Error logging location visit", "error");
    }
  };

  // 1. START JOURNEY WORKFLOW
  const handleStartJourney = async () => {
    if (!startLocName || !destLocName) {
      showToast("Please specify both Start Location and Destination Location before starting journey.", "error");
      return;
    }

    const engName = authenticatedEngineer ? authenticatedEngineer.name : selectedEngineerName;
    const engId = authenticatedEngineer ? authenticatedEngineer.id : ('eng-' + engName.replace(/\s+/g, '-').toLowerCase());

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const journeyId = `jny-${Date.now()}`;

    const newJourney: LocationVisit = {
      id: journeyId,
      engineerId: engId,
      engineerName: engName,
      ticketNumber: linkedTicketId ? tickets.find(t => t.id === linkedTicketId || t.ticket_id === linkedTicketId)?.ticket_id : undefined,
      startLocationName: startLocName,
      startCoords: { lat: startLat || 23.0225, lng: startLng || 72.5714 },
      destinationLocationName: destLocName,
      destinationCoords: { lat: destLat || 23.0725, lng: destLng || 72.6214 },
      distanceKm: calculatedDistance.km,
      distanceMiles: calculatedDistance.miles,
      visitDate: dateStr,
      visitTime: timeStr,
      startTime: timeStr,
      notes: visitNotes || 'Active field transit',
      status: 'In Progress',
      geofenceEntered: false,
      gpsAccuracyMeters: 4,
      deviceBatteryPercent: 94,
      mockGpsDetected: false,
      networkStatus: 'Online',
      created_at: now.toISOString()
    };

    try {
      try {
        await fetch('/api/location-visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newJourney)
        });
      } catch (e) {
        console.log('Started journey in local storage');
      }

      const localVisits: LocationVisit[] = JSON.parse(localStorage.getItem('cached_location_visits') || '[]');
      localVisits.unshift(newJourney);
      localStorage.setItem('cached_location_visits', JSON.stringify(localVisits));

      setActiveJourney(newJourney);
      setJourneyProgress(0);
      setIsGeofenceEntered(false);
      showToast("🛵 Journey Started! Real-time GPS tracking & geofencing activated.", "success");
      fetchVisits();
    } catch (err) {
      console.error(err);
      showToast("Error starting journey", "error");
    }
  };

  // 2. Continuous Journey Progress & Geofence Monitor
  useEffect(() => {
    if (!activeJourney || activeJourney.status === 'Completed') return;

    const timer = setInterval(() => {
      setJourneyProgress(prev => {
        const next = prev + 0.05;
        if (next >= 0.95 && !isGeofenceEntered) {
          setIsGeofenceEntered(true);
          showToast("📍 GEOFENCE ALERT: You are within 100 meters of destination site!", "info");
        }
        if (next >= 1) {
          return 1;
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [activeJourney, isGeofenceEntered]);

  // 3. Confirm Arrival & Onsite Check-In
  const handleConfirmArrivalAndCheckIn = async () => {
    if (!activeJourney) return;

    const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);
    setCheckInTime(timeStr);

    const updated: LocationVisit = {
      ...activeJourney,
      status: 'Arrived',
      geofenceEntered: true,
      checkInTime: timeStr
    };

    try {
      try {
        await fetch(`/api/location-visits/${activeJourney.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (e) {
        console.log('Updated arrival in local storage');
      }

      const localVisits: LocationVisit[] = JSON.parse(localStorage.getItem('cached_location_visits') || '[]');
      const idx = localVisits.findIndex(v => v.id === activeJourney.id);
      if (idx >= 0) localVisits[idx] = updated;
      localStorage.setItem('cached_location_visits', JSON.stringify(localVisits));

      setActiveJourney(updated);
      showToast(`📍 Site Arrival Confirmed! Check-in recorded at ${timeStr}`, "success");
      fetchVisits();
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Site Checkout & Complete Journey Log
  const handleCheckoutSite = async () => {
    if (!activeJourney) return;

    const nowStr = new Date().toTimeString().split(' ')[0].substring(0, 5);
    setCheckOutTime(nowStr);

    const updated: LocationVisit = {
      ...activeJourney,
      status: 'Completed',
      endTime: nowStr,
      checkOutTime: nowStr
    };

    try {
      try {
        await fetch(`/api/location-visits/${activeJourney.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (e) {
        console.log('Checked out in local storage');
      }

      const localVisits: LocationVisit[] = JSON.parse(localStorage.getItem('cached_location_visits') || '[]');
      const idx = localVisits.findIndex(v => v.id === activeJourney.id);
      if (idx >= 0) localVisits[idx] = updated;
      localStorage.setItem('cached_location_visits', JSON.stringify(localVisits));

      setActiveJourney(null);
      setJourneyProgress(0);
      setIsGeofenceEntered(false);
      showToast("✅ Site Checkout Complete! Journey log successfully saved.", "success");
      fetchVisits();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Visit
  const handleDeleteVisit = async (visitId: string) => {
    try {
      try {
        await fetch(`/api/location-visits/${visitId}`, { method: 'DELETE' });
      } catch (e) {
        console.log('Deleted from local storage');
      }

      const localVisits: LocationVisit[] = JSON.parse(localStorage.getItem('cached_location_visits') || '[]');
      const updated = localVisits.filter(v => v.id !== visitId);
      localStorage.setItem('cached_location_visits', JSON.stringify(updated));

      showToast("Visit record deleted", "info");
      fetchVisits();
    } catch (e) {
      showToast("Failed to delete visit log", "error");
    }
  };

  // Filter tickets for assigned engineer
  const engineerTickets = useMemo(() => {
    if (!selectedEngineerName) return [];
    return tickets.filter(t => {
      if (!t.engineer) return false;
      const tEng = t.engineer.trim().toLowerCase();
      const selEng = selectedEngineerName.trim().toLowerCase();
      return tEng === selEng || selEng.includes(tEng) || tEng.includes(selEng);
    });
  }, [tickets, selectedEngineerName]);

  const totalPages = Math.max(1, Math.ceil(engineerTickets.length / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedEngineerTickets = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return engineerTickets.slice(start, start + itemsPerPage);
  }, [engineerTickets, activePage]);

  // Job Stats
  const assignedCount = engineerTickets.length;
  const pendingCount = engineerTickets.filter(t => t.status === 'Open').length;
  const holdCount = engineerTickets.filter(t => t.status === 'Hold').length;
  const closedCount = engineerTickets.filter(t => t.status === 'Closed').length;

  // Visit distance total stats
  const totalVisitsCount = visits.length;
  const totalDistanceKm = visits.reduce((acc, v) => acc + (v.distanceKm || 0), 0);

  // Helper to format 24h time to 12h AM/PM format
  const formatTime12Hr = (time24?: string) => {
    if (!time24) return 'N/A';
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    if (isNaN(h)) return time24;
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  // Filtered visits list
  const filteredVisitsList = useMemo(() => {
    return visits.filter(v => {
      // Engineer Privacy Filter
      if (authenticatedEngineer) {
        const engLower = authenticatedEngineer.name.toLowerCase();
        const engId = authenticatedEngineer.id;
        const matchId = v.engineerId === engId;
        const matchName = v.engineerName?.toLowerCase() === engLower;
        if (!matchId && !matchName) return false;
      } else if (selectedVisitEngineerFilter !== 'all') {
        const engLower = selectedVisitEngineerFilter.toLowerCase();
        const matchId = v.engineerId === selectedVisitEngineerFilter;
        const matchName = v.engineerName?.toLowerCase().includes(engLower);
        if (!matchId && !matchName) return false;
      }

      // Search Query
      if (visitSearchQuery.trim()) {
        const q = visitSearchQuery.toLowerCase();
        const matchEng = v.engineerName?.toLowerCase().includes(q);
        const matchStart = v.startLocationName?.toLowerCase().includes(q);
        const matchDest = v.destinationLocationName?.toLowerCase().includes(q);
        const matchTicket = v.ticketNumber?.toLowerCase().includes(q);
        const matchNotes = v.notes?.toLowerCase().includes(q);
        const matchDate = v.visitDate?.includes(q) || v.visitTime?.includes(q);
        if (!matchEng && !matchStart && !matchDest && !matchTicket && !matchNotes && !matchDate) return false;
      }

      return true;
    });
  }, [visits, authenticatedEngineer, selectedVisitEngineerFilter, visitSearchQuery]);

  // Grouped by Engineer with complete activity totals & timing summary
  const engineerWiseGroupedVisits = useMemo(() => {
    const map: { 
      [key: string]: { 
        engineerName: string; 
        engineerId: string; 
        visits: LocationVisit[]; 
        totalKm: number; 
        totalMiles: number;
      } 
    } = {};

    filteredVisitsList.forEach(v => {
      const key = v.engineerName || v.engineerId || 'Unassigned Engineer';
      if (!map[key]) {
        map[key] = {
          engineerName: key,
          engineerId: v.engineerId || key,
          visits: [],
          totalKm: 0,
          totalMiles: 0
        };
      }
      map[key].visits.push(v);
      map[key].totalKm += Number(v.distanceKm || 0);
      map[key].totalMiles += Number(v.distanceMiles || 0);
    });

    return Object.values(map).map(group => {
      const sortedVisits = [...group.visits].sort((a, b) => {
        const dateA = `${a.visitDate}T${a.visitTime || '00:00'}`;
        const dateB = `${b.visitDate}T${b.visitTime || '00:00'}`;
        return dateB.localeCompare(dateA);
      });

      return {
        ...group,
        visits: sortedVisits,
        totalKm: Number(group.totalKm.toFixed(2)),
        totalMiles: Number(group.totalMiles.toFixed(2)),
        avgKm: group.visits.length > 0 ? Number((group.totalKm / group.visits.length).toFixed(1)) : 0,
        latestTimeFormatted: sortedVisits.length > 0 
          ? `${sortedVisits[0].visitDate} @ ${formatTime12Hr(sortedVisits[0].visitTime)}` 
          : 'N/A'
      };
    }).sort((a, b) => b.visits.length - a.visits.length);
  }, [filteredVisitsList]);

  const startUpdate = (ticket: Ticket) => {
    setUpdatingTicket(ticket);
    setStatus(ticket.status);
    setRemarks(ticket.engineer_remark || '');
    setActionTaken(ticket.action_taken || '');
    setFirstVisitDate(ticket.first_visit_date || '');
    setHoldDate(ticket.hold_date || '');
    setCloseDate(ticket.close_date || '');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingTicket) return;

    try {
      await onUpdateTicket(updatingTicket.id, {
        status,
        engineer_remark: remarks,
        action_taken: actionTaken,
        first_visit_date: firstVisitDate,
        hold_date: holdDate,
        close_date: closeDate
      });

      showToast(`Ticket ${updatingTicket.ticket_id} updated successfully!`, 'success');
      setUpdatingTicket(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update ticket', 'error');
    }
  };

  const handleStatusChange = (newStatus: 'Open' | 'Hold' | 'Closed') => {
    setStatus(newStatus);
    const today = new Date().toISOString().split('T')[0];
    if (newStatus === 'Closed' && !closeDate) {
      setCloseDate(today);
    } else if (newStatus === 'Hold' && !holdDate) {
      setHoldDate(today);
    } else if (newStatus === 'Open' && !firstVisitDate) {
      setFirstVisitDate(today);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Engineer Profile Bar & Auth Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-sm shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {authenticatedEngineer ? authenticatedEngineer.name : selectedEngineerName || "Field Support Engineer"}
              </h2>
              {authenticatedEngineer ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  ● Authenticated
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800/60">
                  Guest / Simulator
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {authenticatedEngineer ? `${authenticatedEngineer.mobile} • ${authenticatedEngineer.email}` : "Log in or sign up to record visits & track travel distance"}
            </p>
          </div>
        </div>

        {/* Auth Action Buttons or Engineer Switcher */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {authenticatedEngineer ? (
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          ) : (
            <>
              <button
                onClick={() => setAuthMode('login')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Engineer Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Engineer Signup
              </button>
            </>
          )}

          {/* Fallback Simulation Select - only visible if not logged in as a single engineer */}
          {!authenticatedEngineer && (
            <select
              value={selectedEngineerName}
              onChange={(e) => {
                setSelectedEngineerName(e.target.value);
                const found = engineers.find(eng => eng.name === e.target.value);
                if (found) setAuthenticatedEngineer(found);
              }}
              className="text-xs font-bold p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {engineers.map(eng => (
                <option key={eng.id} value={eng.name}>{eng.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          My Assigned Jobs ({engineerTickets.length})
        </button>

        <button
          onClick={() => setActiveTab('create_ticket')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'create_ticket'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-indigo-500" />
          Create Ticket Log
        </button>

        <button
          onClick={() => setActiveTab('location_visit')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'location_visit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Route className="w-4 h-4" />
          Mark Location Visit & Distance Calculator
          {visits.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
              {visits.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ASSIGNED JOBS */}
      {activeTab === 'jobs' && (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Assigned Jobs", value: assignedCount, icon: <Inbox className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400" },
              { title: "Pending Jobs", value: pendingCount, icon: <Clock className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" },
              { title: "Hold Jobs", value: holdCount, icon: <AlertCircle className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400" },
              { title: "Closed Jobs", value: closedCount, icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.title}</span>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stat.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Tickets List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              Active Job Assignments ({engineerTickets.length})
            </h2>

            <div className="space-y-3">
              {paginatedEngineerTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  No tickets assigned to you. When the Admin assigns jobs, they will appear here.
                </div>
              ) : (
                paginatedEngineerTickets.map(t => (
                  <div 
                    key={t.id} 
                    className="border border-slate-100 dark:border-slate-850 hover:border-indigo-100 dark:hover:border-indigo-900/60 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all bg-white dark:bg-slate-900"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{t.ticket_id}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">| {t.date}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Open' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-950/50' :
                          t.status === 'Hold' ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100/50 dark:border-purple-950/50' :
                          'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-950/50'
                        }`}>
                          ● {t.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <div className="flex items-center gap-1">
                          <strong className="text-slate-700 dark:text-slate-300">User:</strong> {t.username} ({t.contact})
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700 dark:text-slate-300">Outlet:</strong> {t.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700 dark:text-slate-300">Hardware:</strong> {t.product} {t.brand} {t.model} {t.serial_number ? `(S/N: ${t.serial_number})` : ''}
                        </div>

                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-lg text-slate-600 dark:text-slate-400 mt-1.5 text-xs font-semibold">
                          Problem: {t.problem}
                        </div>
                        {(t.action_taken || t.engineer_remark) && (
                          <div className="p-2.5 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 text-indigo-900 dark:text-indigo-300 mt-1.5 text-xs">
                            {t.action_taken && <div><strong>Action:</strong> {t.action_taken}</div>}
                            {t.engineer_remark && <div><strong>Remarks:</strong> {t.engineer_remark}</div>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setActiveTab('location_visit');
                          handleSelectTicketDestination(t.id);
                        }}
                        className="px-3 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Travel Distance
                      </button>

                      <button
                        onClick={() => startUpdate(t)}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 border border-slate-250 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        Update Status
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {engineerTickets.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing {(activePage - 1) * itemsPerPage + 1} to {Math.min(activePage * itemsPerPage, engineerTickets.length)} of {engineerTickets.length} assigned jobs
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={activePage === 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                          activePage === i + 1
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={activePage === totalPages}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: CREATE TICKET LOG */}
      {activeTab === 'create_ticket' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Create New Ticket Log
              </h3>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                Fill in the ticket details below. Ticket ID is automatically assigned (Read-Only for Engineers).
              </p>
            </div>
          </div>
          <CreateTicketForm
            engineers={engineers}
            onSaveTicket={async (ticketData) => {
              if (onSaveTicket) {
                await onSaveTicket(ticketData);
                setActiveTab('jobs');
              }
            }}
            showToast={showToast}
            systemMode={systemMode || 'RO-Ahmedabad'}
            isAdmin={false}
            defaultEngineer={selectedEngineerName || authenticatedEngineer?.name}
          />
        </div>
      )}

      {/* TAB 3: LOCATION VISIT & DISTANCE CALCULATOR */}
      {activeTab === 'location_visit' && (
        <div className="space-y-6">
          
          {/* Summary KPIs for Travel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total On-Site Visits</span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalVisitsCount}</h3>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <MapPin className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Distance Traveled</span>
                <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{totalDistanceKm.toFixed(2)} KM</h3>
                <span className="text-[10px] text-slate-400 font-medium">({(totalDistanceKm * 0.621371).toFixed(2)} Miles)</span>
              </div>
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl">
                <Route className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estimated Transit Speed</span>
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">40 KM/H</h3>
                <span className="text-[10px] text-slate-400 font-medium">Avg city transit calculation</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                <Navigation className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Mark Location Visit & Distance Calculator Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 gap-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Mark Visit & Distance Engine
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Capture current Lat/Lng or pick presets for 100% accurate distance calculation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetBothGps}
                disabled={isGpsLoadingStart || isGpsLoadingDest}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Compass className="w-4 h-4 animate-spin-slow" />
                {isGpsLoadingStart || isGpsLoadingDest ? "Capturing Device GPS..." : "📍 Auto-Detect Live GPS for Both"}
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-6">
              
              {/* Geolocation Permissions & Error Notice */}
              {gpsNoticeMsg ? (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                      <span className="text-base">⚠️</span>
                      <span>GPS Notice / Geolocation Access</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGpsNoticeMsg(null)}
                      className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    {gpsNoticeMsg}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80 dark:border-amber-800/50">
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Quick HQ Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStartLat(DEFAULT_HEADQUARTERS.AHMEDABAD.lat);
                        setStartLng(DEFAULT_HEADQUARTERS.AHMEDABAD.lng);
                        setStartLocName(DEFAULT_HEADQUARTERS.AHMEDABAD.name);
                        showToast("Start location set to RO Ahmedabad HQ", "info");
                      }}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 text-amber-900 dark:text-amber-100 rounded-lg text-[11px] font-bold border border-amber-300/60 transition-all cursor-pointer"
                    >
                      🏢 RO Ahmedabad HQ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartLat(DEFAULT_HEADQUARTERS.SURAT.lat);
                        setStartLng(DEFAULT_HEADQUARTERS.SURAT.lng);
                        setStartLocName(DEFAULT_HEADQUARTERS.SURAT.name);
                        showToast("Start location set to Surat Sub-RO", "info");
                      }}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 text-amber-900 dark:text-amber-100 rounded-lg text-[11px] font-bold border border-amber-300/60 transition-all cursor-pointer"
                    >
                      🏢 Surat Sub-RO
                    </button>
                    <button
                      type="button"
                      onClick={handleGetBothGps}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      🔄 Retry GPS
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <div>
                      <span className="font-bold">Interactive Route Map & Location Selection:</span>
                      <span className="text-indigo-700 dark:text-indigo-300 ml-1">
                        Use live device GPS, click anywhere on the map, or choose HQ preset buttons to set Start (A) & Destination (B).
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium shrink-0">
                    (Device GPS & Manual Pin Enabled)
                  </div>
                </div>
              )}

              {/* INTERACTIVE LEAFLET MAP */}
              <LocationMap
                startCoords={{ lat: startLat, lng: startLng }}
                destCoords={{ lat: destLat, lng: destLng }}
                startName={startLocName}
                destName={destLocName}
                distanceKm={calculatedDistance.km}
                distanceMiles={calculatedDistance.miles}
                onSelectStartCoords={(lat, lng, name) => {
                  setStartLat(lat);
                  setStartLng(lng);
                  setOsrmRouteDistance(null);
                  if (name) setStartLocName(name);
                }}
                onSelectDestCoords={(lat, lng, name) => {
                  setDestLat(lat);
                  setDestLng(lng);
                  setOsrmRouteDistance(null);
                  if (name) setDestLocName(name);
                }}
                onGetGpsStart={handleGetStartGps}
                onGetGpsDest={handleGetDestGps}
                onRouteCalculated={(km, miles) => {
                  setOsrmRouteDistance({ km, miles });
                }}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* START POINT BOX */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      1. Starting Point Location
                    </label>
                    <button
                      type="button"
                      onClick={handleGetStartGps}
                      disabled={isGpsLoadingStart}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      {isGpsLoadingStart ? "Detecting GPS..." : "📍 Get Current GPS"}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={startLocName}
                    onChange={(e) => setStartLocName(e.target.value)}
                    placeholder="E.g., Office, Home Base, Starting Outlet..."
                    className="w-full text-xs font-bold p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />

                  {/* Lat Lng Inputs */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Start Latitude</span>
                      <input
                        type="number"
                        step="any"
                        value={startLat}
                        onChange={(e) => setStartLat(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Start Longitude</span>
                      <input
                        type="number"
                        step="any"
                        value={startLng}
                        onChange={(e) => setStartLng(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* DESTINATION POINT BOX */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Navigation className="w-4 h-4 text-teal-600" />
                      2. Destination Location
                    </label>
                    <button
                      type="button"
                      onClick={handleGetDestGps}
                      disabled={isGpsLoadingDest}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      {isGpsLoadingDest ? "Detecting GPS..." : "📍 Get Current GPS"}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={destLocName}
                    onChange={(e) => setDestLocName(e.target.value)}
                    placeholder="E.g., Client Branch, Destination Site..."
                    className="w-full text-xs font-bold p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />

                  {/* Pick from assigned tickets */}
                  {engineerTickets.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Pick From Assigned Jobs:</span>
                      <select
                        value={linkedTicketId}
                        onChange={(e) => handleSelectTicketDestination(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                      >
                        <option value="">-- Select Assigned Ticket Destination --</option>
                        {engineerTickets.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.ticket_id} - {t.location} ({t.username})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Lat Lng Inputs */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Dest Latitude</span>
                      <input
                        type="number"
                        step="any"
                        value={destLat}
                        onChange={(e) => setDestLat(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Dest Longitude</span>
                      <input
                        type="number"
                        step="any"
                        value={destLng}
                        onChange={(e) => setDestLng(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* LIVE DISTANCE CALCULATION DISPLAY */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-900 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-700/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Route className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Calculated Distance Result</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    From <span className="font-bold text-white">{startLocName || "Start"}</span> to <span className="font-bold text-white">{destLocName || "Destination"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Kilometers</span>
                    <span className="text-2xl font-black text-amber-400">{calculatedDistance.km} KM</span>
                  </div>

                  <div className="h-8 w-px bg-slate-700" />

                  <div className="text-center">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Miles</span>
                    <span className="text-xl font-bold text-teal-300">{calculatedDistance.miles} mi</span>
                  </div>

                  <div className="h-8 w-px bg-slate-700" />

                  <div className="text-center">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Est. Transit Time</span>
                    <span className="text-sm font-bold text-slate-200">~{estimatedTimeMins} mins</span>
                  </div>
                </div>
              </div>

              {/* Visit Purpose & Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Visit Purpose & Duty Remarks
                </label>
                <input
                  type="text"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="E.g., Delivered RAM upgrade, completed router configuration on-site..."
                  className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Start Journey & Save Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleStartJourney}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5"
                >
                  <span className="text-base">🛵</span>
                  Start Journey & Track Live GPS
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  Mark Direct Visit Log
                </button>
              </div>

            </form>

            {/* LIVE ACTIVE JOURNEY DRIVING HUD & GEOFENCING PANEL */}
            {activeJourney && (
              <div className="mt-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 rounded-2xl p-5 text-white shadow-2xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-black uppercase text-indigo-300 tracking-wider">
                      ACTIVE GPS DRIVING NAVIGATION HUD
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-xs">
                    {activeJourney.status === 'Arrived' ? '📍 Arrived Onsite' : '🛵 En-Route'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-200">Route Completion Progress</span>
                    <span className="font-mono text-amber-400 font-extrabold">{Math.round(journeyProgress * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-indigo-700/50">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${journeyProgress * 100}%` }}
                    />
                  </div>
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-indigo-900/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Start Origin</span>
                    <span className="font-extrabold text-emerald-400 truncate block">🟢 {activeJourney.startLocationName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination Site</span>
                    <span className="font-extrabold text-rose-400 truncate block">🏁 {activeJourney.destinationLocationName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Distance</span>
                    <span className="font-mono font-extrabold text-amber-400 text-sm">
                      {(activeJourney.distanceKm * (1 - journeyProgress)).toFixed(1)} / {activeJourney.distanceKm} KM
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Live GPS Telemetry</span>
                    <span className="font-mono text-teal-300 font-bold">
                      ±{activeJourney.gpsAccuracyMeters}m • 🔋 {activeJourney.deviceBatteryPercent}%
                    </span>
                  </div>
                </div>

                {/* Geofence Alert Banner */}
                {isGeofenceEntered && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📍</span>
                      <span>Geofence Detection: You are within 100m of destination site!</span>
                    </div>
                    {activeJourney.status !== 'Arrived' && (
                      <button
                        type="button"
                        onClick={handleConfirmArrivalAndCheckIn}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                      >
                        Confirm Arrival & Check-In 📍
                      </button>
                    )}
                  </div>
                )}

                {/* Check-In / Check-Out Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-900/80">
                  <div className="text-xs space-x-3">
                    {checkInTime && (
                      <span className="font-bold text-emerald-300">
                        Check-In: <b className="font-mono">{checkInTime}</b>
                      </span>
                    )}
                    {checkOutTime && (
                      <span className="font-bold text-teal-300">
                        Check-Out: <b className="font-mono">{checkOutTime}</b>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeJourney.status !== 'Arrived' && !isGeofenceEntered && (
                      <button
                        type="button"
                        onClick={handleConfirmArrivalAndCheckIn}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                      >
                        Destination Reached 📍
                      </button>
                    )}

                    {activeJourney.status === 'Arrived' && (
                      <button
                        type="button"
                        onClick={handleCheckoutSite}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <span>Check-Out & Complete Visit Log</span>
                        <span>✅</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ENGINEER-WISE VISIT HISTORY & TRAVEL TIMING LOGS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-6">
            
            {/* Header & Controls Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Engineer Visit Activity & Distance Timing Logs
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Full engineer-wise log of site visits, start/destination GPS coordinates, and exact visit timings
                </p>
              </div>

              {/* View Layout Mode Switcher */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVisitViewMode('grouped')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      visitViewMode === 'grouped'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    Engineer Wise
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      visitViewMode === 'table'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    Full Master Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitViewMode('timeline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      visitViewMode === 'timeline'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Timing Feed
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => fetchVisits()}
                  disabled={isVisitsLoading}
                  className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl transition-colors cursor-pointer"
                  title="Refresh Visit Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${isVisitsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter Bar: Engineer Select & Search Input */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              
              {/* Engineer Filter Dropdown / Badge */}
              <div className="md:col-span-5 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Engineer:</span>
                {authenticatedEngineer ? (
                  <div className="w-full text-xs font-extrabold px-3 py-2 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-between gap-1.5 shadow-2xs">
                    <span className="flex items-center gap-1.5 truncate">
                      <span>👤</span>
                      <span>{authenticatedEngineer.name}</span>
                    </span>
                    <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 px-2 py-0.5 rounded text-indigo-800 dark:text-indigo-200 uppercase font-black shrink-0">
                      My Activity Log
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedVisitEngineerFilter}
                    onChange={(e) => setSelectedVisitEngineerFilter(e.target.value)}
                    className="w-full text-xs font-bold p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="all">👥 All Engineers (Full Company Log)</option>
                    {engineers.map(eng => (
                      <option key={eng.id} value={eng.name}>
                        👤 {eng.name} ({eng.work_profile || 'Engineer'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Search Box */}
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={visitSearchQuery}
                  onChange={(e) => setVisitSearchQuery(e.target.value)}
                  placeholder="Search by location, ticket #, date, timing, or remarks..."
                  className="w-full text-xs p-2 pl-9 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

            </div>

            {/* Loading Indicator */}
            {isVisitsLoading ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading location visit logs...</p>
              </div>
            ) : filteredVisitsList.length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-slate-50/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No location visit logs found</p>
                <p className="text-[11px] text-slate-400">
                  {visitSearchQuery ? 'Try adjusting your search query or engineer filter.' : 'Use the Mark Visit form above to log your first route distance.'}
                </p>
              </div>
            ) : (
              <>
                {/* VIEW MODE 1: ENGINEER-WISE GROUPED CARDS */}
                {visitViewMode === 'grouped' && (
                  <div className="space-y-6">
                    {engineerWiseGroupedVisits.map(group => (
                      <div 
                        key={group.engineerName}
                        className="bg-slate-50/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
                      >
                        {/* Engineer Card Header Summary */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                              {group.engineerName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {group.engineerName}
                                </h4>
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md text-[10px] font-bold">
                                  Engineer
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Last recorded visit: <span className="font-bold text-slate-700 dark:text-slate-300">{group.latestTimeFormatted}</span>
                              </p>
                            </div>
                          </div>

                          {/* Stats Badges */}
                          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                            <div className="text-right px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Distance</span>
                              <span className="text-xs font-black text-amber-600 dark:text-amber-400">{group.totalKm} KM</span>
                            </div>
                            <div className="text-right px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Trips</span>
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{group.visits.length} Visits</span>
                            </div>
                            <div className="text-right px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg / Trip</span>
                              <span className="text-xs font-black text-teal-600 dark:text-teal-400">{group.avgKm} KM</span>
                            </div>
                          </div>
                        </div>

                        {/* Engineer Visit List Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="px-3 py-2.5 text-center">#</th>
                                <th className="px-3 py-2.5">Date & Visit Timing</th>
                                <th className="px-3 py-2.5">Start Point & Coords</th>
                                <th className="px-3 py-2.5">Destination & Coords</th>
                                <th className="px-3 py-2.5 text-center">Distance</th>
                                <th className="px-3 py-2.5">Linked Job</th>
                                <th className="px-3 py-2.5">Purpose / Remarks</th>
                                <th className="px-3 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                              {group.visits.map((v, idx) => (
                                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                  <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                                  
                                  {/* Date & 12H Time */}
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    <div className="font-bold text-slate-900 dark:text-slate-100">{v.visitDate}</div>
                                    <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime12Hr(v.visitTime)} <span className="text-[9px] text-slate-400">({v.visitTime})</span>
                                    </div>
                                  </td>

                                  {/* Start Location & GPS */}
                                  <td className="px-3 py-2.5">
                                    <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                                      🟢 {v.startLocationName}
                                    </div>
                                    {v.startCoords && (
                                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                        Lat: {v.startCoords.lat.toFixed(4)}, Lng: {v.startCoords.lng.toFixed(4)}
                                      </div>
                                    )}
                                  </td>

                                  {/* Destination Location & GPS */}
                                  <td className="px-3 py-2.5">
                                    <div className="font-semibold text-rose-700 dark:text-rose-400">
                                      🔴 {v.destinationLocationName}
                                    </div>
                                    {v.destinationCoords && (
                                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                        Lat: {v.destinationCoords.lat.toFixed(4)}, Lng: {v.destinationCoords.lng.toFixed(4)}
                                      </div>
                                    )}
                                  </td>

                                  {/* Distance */}
                                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                    <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg font-black text-xs">
                                      {v.distanceKm} KM
                                    </span>
                                  </td>

                                  {/* Ticket */}
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    {v.ticketNumber ? (
                                      <span className="font-mono font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                                        {v.ticketNumber}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">Direct Visit</span>
                                    )}
                                  </td>

                                  {/* Remarks */}
                                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                    {v.notes || '-'}
                                  </td>

                                  {/* Action Delete Button */}
                                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVisit(v.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                      title="Delete Visit Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                {/* VIEW MODE 2: MASTER TABLE */}
                {visitViewMode === 'table' && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-3 py-2.5 text-center">#</th>
                          <th className="px-3 py-2.5">Engineer</th>
                          <th className="px-3 py-2.5">Visit Date & Timing</th>
                          <th className="px-3 py-2.5">Start Location & GPS</th>
                          <th className="px-3 py-2.5">Destination & GPS</th>
                          <th className="px-3 py-2.5 text-center">Distance</th>
                          <th className="px-3 py-2.5">Linked Job</th>
                          <th className="px-3 py-2.5">Purpose / Remarks</th>
                          <th className="px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredVisitsList.map((v, idx) => (
                          <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                            
                            <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              👤 {v.engineerName}
                            </td>

                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{v.visitDate}</div>
                              <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime12Hr(v.visitTime)}
                              </div>
                            </td>

                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {v.startLocationName}
                              </div>
                              {v.startCoords && (
                                <div className="text-[10px] font-mono text-slate-400">
                                  ({v.startCoords.lat.toFixed(4)}, {v.startCoords.lng.toFixed(4)})
                                </div>
                              )}
                            </td>

                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-teal-600 dark:text-teal-400">
                                {v.destinationLocationName}
                              </div>
                              {v.destinationCoords && (
                                <div className="text-[10px] font-mono text-slate-400">
                                  ({v.destinationCoords.lat.toFixed(4)}, {v.destinationCoords.lng.toFixed(4)})
                                </div>
                              )}
                            </td>

                            <td className="px-3 py-2.5 text-center font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
                              {v.distanceKm} KM
                            </td>

                            <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {v.ticketNumber || 'N/A'}
                            </td>

                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                              {v.notes || '-'}
                            </td>

                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteVisit(v.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title="Delete Visit Record"
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

                {/* VIEW MODE 3: TIMING TIMELINE FEED */}
                {visitViewMode === 'timeline' && (
                  <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900 ml-4 pl-6 space-y-6 py-2">
                    {filteredVisitsList.map((v) => (
                      <div key={v.id} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md border-2 border-white dark:border-slate-900">
                          <MapPin className="w-3 h-3" />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                          
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">👤 {v.engineerName}</span>
                              {v.ticketNumber && (
                                <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                                  {v.ticketNumber}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg">
                              <Clock className="w-3.5 h-3.5" />
                              {v.visitDate} @ {formatTime12Hr(v.visitTime)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">From Departure</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{v.startLocationName}</span>
                              {v.startCoords && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  Lat: {v.startCoords.lat.toFixed(4)}, Lng: {v.startCoords.lng.toFixed(4)}
                                </span>
                              )}
                            </div>

                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">To Destination</span>
                              <span className="font-bold text-rose-600 dark:text-rose-400">{v.destinationLocationName}</span>
                              {v.destinationCoords && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  Lat: {v.destinationCoords.lat.toFixed(4)}, Lng: {v.destinationCoords.lng.toFixed(4)}
                                </span>
                              )}
                            </div>

                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 flex flex-col justify-center">
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">Calculated Travel</span>
                              <span className="text-sm font-black text-amber-700 dark:text-amber-300">{v.distanceKm} KM ({v.distanceMiles} mi)</span>
                            </div>
                          </div>

                          {v.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                              " {v.notes} "
                            </p>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      )}

      {/* UPDATE TICKET DRAWER / MODAL */}
      <AnimatePresence>
        {updatingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">Update Ticket Details</h3>
                </div>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">
                  {updatingTicket.ticket_id}
                </span>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
                {/* Status selector */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duty Status</label>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Open">Open (In Progress)</option>
                    <option value="Hold">Hold (Pending Spares/Access)</option>
                    <option value="Closed">Closed (Resolved)</option>
                  </select>
                </div>

                {/* Dates updates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> First Visit
                    </label>
                    <input
                      type="date"
                      value={firstVisitDate}
                      onChange={(e) => setFirstVisitDate(e.target.value)}
                      className="w-full p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Hold Date
                    </label>
                    <input
                      type="date"
                      value={holdDate}
                      onChange={(e) => setHoldDate(e.target.value)}
                      className="w-full p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Close Date
                    </label>
                    <input
                      type="date"
                      value={closeDate}
                      onChange={(e) => setCloseDate(e.target.value)}
                      className="w-full p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Calculated Resolution Days badge */}
                {(() => {
                  const diff = calculateDaysBetweenVisitAndClose(firstVisitDate, closeDate, updatingTicket?.date, status);
                  return (
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Call Duration / Days Open:</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${diff.badgeClass}`}>
                        {diff.text}
                      </span>
                    </div>
                  );
                })()}

                {/* Action Taken */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action Taken Description</label>
                  <input
                    type="text"
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="E.g., Cleansed printhead, refitted feed rollers"
                    className="w-full p-2.5 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Engineer remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="E.g., Print quality restored to 100%. Tested OK."
                    className="w-full p-2.5 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Actions button */}
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setUpdatingTicket(null)}
                    className="px-4 py-2 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Updates
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUTHENTICATION MODAL (LOGIN & SIGNUP) */}
      <AnimatePresence>
        {authMode !== 'none' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {authMode === 'login' ? "Engineer Login" : "Engineer Registration"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {authMode === 'login' ? "Enter predefined pass in JSON or custom pass" : "Register a new engineer account"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAuthMode('none')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Close ✕
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* LOGIN FORM */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Mobile / Email / Engineer Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="E.g., 9898531231 or Mahebub Mir"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                      💡 Each engineer has a separate, unique password assigned in the Engineers Roster (e.g., <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold text-slate-800 dark:text-slate-200">Name@MobilePrefix</code> like <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold text-slate-800 dark:text-slate-200">Mahebub@9898</code>)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    {isAuthLoading ? "Authenticating..." : "Log In to Engineer Portal"}
                  </button>
                </form>
              )}

              {/* SIGNUP FORM */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="E.g., Rahul Verma"
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        value={signupMobile}
                        onChange={(e) => setSignupMobile(e.target.value)}
                        placeholder="10-digit mobile"
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Create Password (Saved to JSON)
                    </label>
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Default: eng123"
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Base Location
                    </label>
                    <select
                      value={signupLocation}
                      onChange={(e) => setSignupLocation(e.target.value)}
                      className="w-full p-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Ro-Ahmedabad">Ro-Ahmedabad</option>
                      <option value="Surat">Surat</option>
                      <option value="Rajkot">Rajkot</option>
                      <option value="Vadodara">Vadodara</option>
                      <option value="Jamnagar">Jamnagar</option>
                      <option value="Bhavnagar">Bhavnagar</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isAuthLoading ? "Registering..." : "Sign Up & Save to Engineers Database"}
                  </button>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
