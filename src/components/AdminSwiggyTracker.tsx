import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { LocationVisit, Engineer, GPSTrackPoint } from '../types';
import { 
  MapPin, 
  Navigation, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Activity, 
  User, 
  Search, 
  ExternalLink,
  ShieldAlert,
  Compass,
  Zap,
  CheckCircle2,
  RefreshCw,
  Printer,
  FileText,
  Download,
  Trash2,
  BatteryCharging,
  Sliders,
  X,
  Check
} from 'lucide-react';

interface AdminSwiggyTrackerProps {
  engineers: Engineer[];
  visits: LocationVisit[];
  onRefreshVisits?: () => void;
}

export const AdminSwiggyTracker: React.FC<AdminSwiggyTrackerProps> = ({
  engineers,
  visits,
  onRefreshVisits
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Selected visit to track
  const [selectedVisitId, setSelectedVisitId] = useState<string>('');
  const [selectedEngineerName, setSelectedEngineerName] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live simulation states (Swiggy motorcycle motion)
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0); // 0 to 1
  const [simSpeedKmH, setSimSpeedKmH] = useState<number>(38);
  const [etaMins, setEtaMins] = useState<number>(15);

  // Playback Modal State
  const [playbackVisit, setPlaybackVisit] = useState<LocationVisit | null>(null);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState<boolean>(false);
  const [playbackMultiplier, setPlaybackMultiplier] = useState<number>(1);
  const playbackMapContainerRef = useRef<HTMLDivElement>(null);
  const playbackMapRef = useRef<L.Map | null>(null);
  const playbackRiderMarkerRef = useRef<L.Marker | null>(null);
  const playbackPolylineRef = useRef<L.Polyline | null>(null);

  const [visitToDelete, setVisitToDelete] = useState<LocationVisit | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleResetAllVisits = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/location-visits', { method: 'DELETE' });
      if (res.ok) {
        setSelectedVisitId('');
        setShowResetConfirmModal(false);
        if (onRefreshVisits) onRefreshVisits();
      } else {
        console.error("Failed to reset live tracking logs");
      }
    } catch (err) {
      console.error("Error clearing live tracking logs:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingleVisit = async (visitId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/location-visits/${visitId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedVisitId === visitId) setSelectedVisitId('');
        setVisitToDelete(null);
        if (onRefreshVisits) onRefreshVisits();
      }
    } catch (err) {
      console.error("Error deleting visit entry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered visits list
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      if (selectedEngineerName !== 'all') {
        const nameMatch = v.engineerName?.toLowerCase() === selectedEngineerName.toLowerCase();
        if (!nameMatch) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEng = v.engineerName?.toLowerCase().includes(q);
        const matchStart = v.startLocationName?.toLowerCase().includes(q);
        const matchDest = v.destinationLocationName?.toLowerCase().includes(q);
        const matchTicket = v.ticketNumber?.toLowerCase().includes(q);
        if (!matchEng && !matchStart && !matchDest && !matchTicket) return false;
      }
      return true;
    });
  }, [visits, selectedEngineerName, searchQuery]);

  // Supervisor Top Overview Metrics
  const supervisorMetrics = useMemo(() => {
    const travelling = visits.filter(v => v.status === 'In Progress' || v.status === 'Started').length;
    const arrived = visits.filter(v => v.status === 'Arrived' || v.geofenceEntered).length;
    const completed = visits.filter(v => v.status === 'Completed' || (!v.status && v.distanceKm > 0)).length;
    const totalKm = visits.reduce((sum, v) => sum + Number(v.distanceKm || 0), 0);
    return { travelling, arrived, completed, totalKm };
  }, [visits]);

  // Currently active visit object
  const activeVisit = useMemo(() => {
    if (selectedVisitId) {
      const found = visits.find(v => v.id === selectedVisitId);
      if (found) return found;
    }
    return filteredVisits[0] || visits[0] || null;
  }, [visits, selectedVisitId, filteredVisits]);

  // Grouped visits for engineering table
  const engineerWiseGrouped = useMemo(() => {
    const map: { 
      [key: string]: { 
        engineerName: string; 
        engineerId: string; 
        visits: LocationVisit[]; 
        totalKm: number; 
      } 
    } = {};

    filteredVisits.forEach(v => {
      const name = v.engineerName || v.engineerId || 'Unassigned Engineer';
      if (!map[name]) {
        map[name] = {
          engineerName: name,
          engineerId: v.engineerId || name,
          visits: [],
          totalKm: 0
        };
      }
      map[name].visits.push(v);
      map[name].totalKm += Number(v.distanceKm || 0);
    });

    return Object.values(map);
  }, [filteredVisits]);

  // Export Visit Log to CSV
  const handleExportCSV = (groupVisits?: LocationVisit[]) => {
    const listToExport = groupVisits || filteredVisits;
    if (listToExport.length === 0) {
      alert("No visit records to export.");
      return;
    }

    const headers = [
      "Visit ID", "Engineer Name", "Date", "Time", "Start Location",
      "Destination", "Distance (KM)", "Ticket #", "Status", "GPS Accuracy (m)", "Battery %", "Mock GPS"
    ];

    const rows = listToExport.map(v => [
      v.id,
      `"${(v.engineerName || '').replace(/"/g, '""')}"`,
      v.visitDate || '',
      v.visitTime || '',
      `"${(v.startLocationName || '').replace(/"/g, '""')}"`,
      `"${(v.destinationLocationName || '').replace(/"/g, '""')}"`,
      v.distanceKm || 0,
      v.ticketNumber || 'N/A',
      v.status || 'Completed',
      v.gpsAccuracyMeters || 4,
      v.deviceBatteryPercent || 90,
      v.mockGpsDetected ? 'Detected' : 'Clean'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GPS_Field_Visit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Printable Official Report Generation
  const handlePrintVisitReport = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=850');
    if (!printWindow) {
      alert("Please allow popup windows to generate and print the Official Visit Log Report.");
      return;
    }

    const nowStr = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    let groupedHtml = '';
    engineerWiseGrouped.forEach((group) => {
      groupedHtml += `
        <div style="margin-bottom: 28px; border: 1.5px solid #cbd5e1; border-radius: 10px; overflow: hidden; page-break-inside: avoid; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; letter-spacing: -0.3px;">
                👤 ENGINEER: ${group.engineerName.toUpperCase()}
              </h3>
              <p style="margin: 2px 0 0 0; font-size: 11px; opacity: 0.85;">
                Total Completed Site Trips: ${group.visits.length} Visit Logs
              </p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; font-weight: 800; background: #22c55e; color: #ffffff; padding: 4px 12px; border-radius: 999px;">
                Cumulative Route Distance: ${group.totalKm.toFixed(2)} KM
              </span>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #334155; font-weight: 700; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">
                <th style="padding: 10px 12px; width: 35px;">#</th>
                <th style="padding: 10px 12px; width: 140px;">Date & Timing</th>
                <th style="padding: 10px 12px;">Start Location</th>
                <th style="padding: 10px 12px;">Destination Site</th>
                <th style="padding: 10px 12px; text-align: center; width: 100px;">Distance (KM)</th>
                <th style="padding: 10px 12px;">Job Ticket / Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${group.visits.map((v, i) => `
                <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 9px 12px; font-weight: bold; color: #64748b;">${i + 1}</td>
                  <td style="padding: 9px 12px; font-weight: 600; color: #0f172a;">
                    ${v.visitDate || 'N/A'}<br/>
                    <span style="font-size: 11px; color: #475569; font-weight: 500;">⏰ ${v.visitTime || 'N/A'}</span>
                  </td>
                  <td style="padding: 9px 12px; color: #1e293b; font-weight: 500;">
                    🟢 ${v.startLocationName || 'GPS Location'}
                    ${v.startCoords ? `<br/><span style="font-size: 10px; color: #94a3b8;">Lat: ${v.startCoords.lat.toFixed(4)}, Lng: ${v.startCoords.lng.toFixed(4)}</span>` : ''}
                  </td>
                  <td style="padding: 9px 12px; color: #1e293b; font-weight: 500;">
                    🏁 ${v.destinationLocationName || 'Destination Location'}
                    ${v.destinationCoords ? `<br/><span style="font-size: 10px; color: #94a3b8;">Lat: ${v.destinationCoords.lat.toFixed(4)}, Lng: ${v.destinationCoords.lng.toFixed(4)}</span>` : ''}
                  </td>
                  <td style="padding: 9px 12px; text-align: center; font-weight: 800; color: #2563eb; font-size: 13px;">
                    ${v.distanceKm || '0'} KM
                  </td>
                  <td style="padding: 9px 12px;">
                    ${v.ticketNumber ? `<span style="background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-family: monospace; font-size: 11px;">🎫 Ticket #${v.ticketNumber}</span><br/>` : ''}
                    <span style="color: #475569; font-size: 11px;">${v.notes || 'Routine field visit'}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Engineer Field Visit Activity Report - Administration Portal</title>
          <style>
            @media print {
              .no-print { display: none !important; }
              body { padding: 0 !important; margin: 0 !important; }
              @page { size: A4 portrait; margin: 12mm; }
            }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; background-color: #ffffff; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e1b4b; padding-bottom: 14px; margin-bottom: 24px;">
            <div>
              <h1 style="margin: 0; font-size: 22px; color: #1e1b4b; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
                ENGINEER FIELD VISIT & TRAVEL LOG REPORT
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569; font-weight: 600;">
                ADMINISTRATION PORTAL • OFFICIAL FIELD RADAR LOGS
              </p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div><strong>Generated Date:</strong> ${nowStr}</div>
              <div><strong>Total Active Logs:</strong> ${filteredVisits.length} Records</div>
              <div><strong>Total Engineers Tracked:</strong> ${engineerWiseGrouped.length} Engineers</div>
            </div>
          </div>

          <div class="no-print" style="margin-bottom: 20px; text-align: right; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 12px; font-weight: 600; color: #475569;">
              Click the button on the right to send this report directly to your printer or download as PDF.
            </span>
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 10px 22px; font-weight: 800; border-radius: 8px; cursor: pointer; font-size: 13px;">
              🖨️ Print / Export PDF Report
            </button>
          </div>

          ${groupedHtml || '<p style="text-align: center; color: #64748b; padding: 40px; font-size: 14px;">No visit activity logs available for selected filter.</p>'}

          <div style="margin-top: 36px; border-top: 1.5px dashed #cbd5e1; padding-top: 14px; font-size: 11px; color: #94a3b8; text-align: center;">
            This is an official system audit document generated from the Field Engineer GPS Radar Portal.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  // Initial selected visit
  useEffect(() => {
    if (!selectedVisitId && activeVisit) {
      setSelectedVisitId(activeVisit.id);
    }
  }, [activeVisit, selectedVisitId]);

  // Custom Motorcycle Rider Leaflet Icon
  const createMotorcycleRiderIcon = (engineerName: string, speed: number, isMoving: boolean) => {
    return L.divIcon({
      className: 'custom-swiggy-rider-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
          <div style="
            background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 2px solid white;
            margin-bottom: 4px;
          ">
            <span style="font-size: 14px;">🛵</span>
            <span>${engineerName || 'Field Engineer'}</span>
            <span style="
              background: #22c55e;
              color: white;
              font-size: 8px;
              padding: 1px 5px;
              border-radius: 999px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">${isMoving ? `${speed} km/h` : 'LIVE'}</span>
          </div>

          <div style="
            position: absolute;
            bottom: -2px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(79, 70, 229, 0.25);
            border: 2px solid #6366f1;
            box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
            z-index: 1;
          "></div>

          <div style="
            position: relative;
            z-index: 2;
            background: #ffffff;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #4f46e5;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            font-size: 20px;
          ">
            🏍️
          </div>

          <div style="
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #4f46e5;
            margin-top: -2px;
            z-index: 2;
          "></div>
        </div>
      `,
      iconSize: [120, 80],
      iconAnchor: [60, 75]
    });
  };

  const startIcon = L.divIcon({
    className: 'custom-start-pin',
    html: `
      <div style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 8px; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 4px;">
        <span>🟢</span>
        <span>START</span>
      </div>
    `,
    iconSize: [70, 28],
    iconAnchor: [35, 14]
  });

  const destIcon = L.divIcon({
    className: 'custom-dest-pin',
    html: `
      <div style="background-color: #ef4444; color: white; padding: 4px 8px; border-radius: 8px; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 4px;">
        <span>🏁</span>
        <span>DESTINATION</span>
      </div>
    `,
    iconSize: [100, 28],
    iconAnchor: [50, 14]
  });

  // Main Radar Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([23.0225, 72.5714], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors | Live Field Radar'
      }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Main Radar Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (startMarkerRef.current) { map.removeLayer(startMarkerRef.current); startMarkerRef.current = null; }
    if (destMarkerRef.current) { map.removeLayer(destMarkerRef.current); destMarkerRef.current = null; }
    if (riderMarkerRef.current) { map.removeLayer(riderMarkerRef.current); riderMarkerRef.current = null; }
    if (polylineRef.current) { map.removeLayer(polylineRef.current); polylineRef.current = null; }

    if (!activeVisit) return;

    const startLat = activeVisit.startCoords?.lat || 23.0225;
    const startLng = activeVisit.startCoords?.lng || 72.5714;
    const destLat = activeVisit.destinationCoords?.lat || startLat + 0.05;
    const destLng = activeVisit.destinationCoords?.lng || startLng + 0.05;

    const currentLat = startLat + (destLat - startLat) * simProgress;
    const currentLng = startLng + (destLng - startLng) * simProgress;

    const totalDistKm = activeVisit.distanceKm || 12;
    const distRemaining = (totalDistKm * (1 - simProgress)).toFixed(1);
    const calculatedEta = Math.max(1, Math.round((Number(distRemaining) / simSpeedKmH) * 60));
    setEtaMins(calculatedEta);

    const bounds = L.latLngBounds([]);

    const startM = L.marker([startLat, startLng], { icon: startIcon }).addTo(map);
    startM.bindPopup(`<b>Start Point</b><br/>${activeVisit.startLocationName}`);
    startMarkerRef.current = startM;
    bounds.extend([startLat, startLng]);

    const destM = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
    destM.bindPopup(`<b>Destination Site</b><br/>${activeVisit.destinationLocationName}`);
    destMarkerRef.current = destM;
    bounds.extend([destLat, destLng]);

    const line = L.polyline([
      [startLat, startLng],
      [destLat, destLng]
    ], {
      color: '#4f46e5',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);
    polylineRef.current = line;

    const riderIcon = createMotorcycleRiderIcon(
      activeVisit.engineerName || 'Field Engineer',
      simSpeedKmH,
      isSimulating
    );

    const riderM = L.marker([currentLat, currentLng], { icon: riderIcon }).addTo(map);
    riderM.bindPopup(`
      <div style="font-family: system-ui; text-align: center; padding: 4px;">
        <h4 style="margin: 0; color: #4f46e5; font-weight: 800;">🛵 ${activeVisit.engineerName}</h4>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">
          <b>Speed:</b> ${simSpeedKmH} km/h<br/>
          <b>Distance Remaining:</b> ${distRemaining} KM<br/>
          <b>Est. Arrival:</b> ~${calculatedEta} mins
        </p>
      </div>
    `);
    riderMarkerRef.current = riderM;

    map.fitBounds(bounds, { padding: [60, 60] });

  }, [activeVisit, simProgress, isSimulating, simSpeedKmH]);

  // Main Radar Simulation Animation Loop
  useEffect(() => {
    if (!isSimulating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setSimProgress(prev => {
        const totalKm = activeVisit?.distanceKm || 10;
        const increment = (deltaSec * (simSpeedKmH / totalKm)) / 20;
        const next = prev + increment;
        if (next >= 1) {
          setIsSimulating(false);
          return 1;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, activeVisit, simSpeedKmH]);

  // Generate or retrieve track points for playback modal
  const playbackTrackPoints = useMemo<GPSTrackPoint[]>(() => {
    if (!playbackVisit) return [];
    if (playbackVisit.gpsTrackPoints && playbackVisit.gpsTrackPoints.length >= 2) {
      return playbackVisit.gpsTrackPoints;
    }

    // Interpolate 20 route track points along road path
    const startLat = playbackVisit.startCoords?.lat || 23.0225;
    const startLng = playbackVisit.startCoords?.lng || 72.5714;
    const destLat = playbackVisit.destinationCoords?.lat || startLat + 0.05;
    const destLng = playbackVisit.destinationCoords?.lng || startLng + 0.05;
    const totalDistKm = playbackVisit.distanceKm || 15;

    const points: GPSTrackPoint[] = [];
    const numPoints = 20;
    const baseHour = 9;

    for (let i = 0; i < numPoints; i++) {
      const ratio = i / (numPoints - 1);
      // add realistic curve deviation
      const curveLat = Math.sin(ratio * Math.PI) * 0.008;
      const curveLng = Math.cos(ratio * Math.PI) * 0.008;

      const lat = startLat + (destLat - startLat) * ratio + curveLat;
      const lng = startLng + (destLng - startLng) * ratio + curveLng;

      const mins = Math.floor(ratio * 35);
      const timeStr = `${String(baseHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String((i * 12) % 60).padStart(2, '0')}`;
      
      const speed = i === 0 || i === numPoints - 1 ? 0 : Math.round(35 + Math.sin(ratio * 5) * 12);
      const battery = Math.max(20, Math.round(95 - ratio * 15));

      points.push({
        lat,
        lng,
        timestamp: timeStr,
        speedKmH: speed,
        accuracyMeters: Math.round(3 + Math.random() * 3),
        batteryPercent: battery,
        isMock: false,
        networkStatus: 'Online'
      });
    }

    return points;
  }, [playbackVisit]);

  // Initialize Playback Modal Map
  useEffect(() => {
    if (!playbackVisit || !playbackMapContainerRef.current) return;

    if (!playbackMapRef.current) {
      const pMap = L.map(playbackMapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([23.0225, 72.5714], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors | Journey Replay'
      }).addTo(pMap);

      playbackMapRef.current = pMap;
    }

    return () => {
      if (playbackMapRef.current) {
        playbackMapRef.current.remove();
        playbackMapRef.current = null;
      }
    };
  }, [playbackVisit]);

  // Update Playback Modal Layer
  useEffect(() => {
    const pMap = playbackMapRef.current;
    if (!pMap || !playbackVisit || playbackTrackPoints.length === 0) return;

    if (playbackRiderMarkerRef.current) {
      pMap.removeLayer(playbackRiderMarkerRef.current);
      playbackRiderMarkerRef.current = null;
    }
    if (playbackPolylineRef.current) {
      pMap.removeLayer(playbackPolylineRef.current);
      playbackPolylineRef.current = null;
    }

    const currentPt = playbackTrackPoints[Math.min(playbackIndex, playbackTrackPoints.length - 1)];

    // Polyline of entire route
    const latLngs: [number, number][] = playbackTrackPoints.map(pt => [pt.lat, pt.lng]);
    const line = L.polyline(latLngs, { color: '#6366f1', weight: 5, opacity: 0.85 }).addTo(pMap);
    playbackPolylineRef.current = line;

    // Start & End markers
    const startPt = playbackTrackPoints[0];
    const endPt = playbackTrackPoints[playbackTrackPoints.length - 1];
    L.marker([startPt.lat, startPt.lng], { icon: startIcon }).addTo(pMap);
    L.marker([endPt.lat, endPt.lng], { icon: destIcon }).addTo(pMap);

    // Rider Marker
    const rIcon = createMotorcycleRiderIcon(playbackVisit.engineerName, currentPt.speedKmH, currentPt.speedKmH > 0);
    const rMarker = L.marker([currentPt.lat, currentPt.lng], { icon: rIcon }).addTo(pMap);
    playbackRiderMarkerRef.current = rMarker;

    const bounds = L.latLngBounds(latLngs);
    pMap.fitBounds(bounds, { padding: [40, 40] });

  }, [playbackVisit, playbackIndex, playbackTrackPoints]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaybackPlaying || playbackTrackPoints.length === 0) return;

    const intervalMs = Math.max(100, Math.round(1000 / playbackMultiplier));
    const timer = setInterval(() => {
      setPlaybackIndex(prev => {
        if (prev >= playbackTrackPoints.length - 1) {
          setIsPlaybackPlaying(false);
          return playbackTrackPoints.length - 1;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaybackPlaying, playbackTrackPoints, playbackMultiplier]);

  const currentPlaybackPoint = playbackTrackPoints[playbackIndex] || playbackTrackPoints[0];

  return (
    <div className="space-y-6">
      
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none text-9xl font-black flex items-center justify-center pr-6">
          🛵
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE GPS FIELD TRACKING & ROUTE HISTORY
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🛵</span> Live Engineer Field Radar & Route Playback
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-xl leading-relaxed">
              Real-time map radar tracking, route history playback, automated geofence detection, and tamper-proof GPS visit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleExportCSV()}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handlePrintVisitReport}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Visit Report
            </button>

            {onRefreshVisits && (
              <button
                type="button"
                onClick={onRefreshVisits}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Reset and clear active live tracking logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* SUPERVISOR METRICS HUD CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Travelling 🛵</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {supervisorMetrics.travelling} <span className="text-xs font-bold text-slate-400">Active Journeys</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Onsite / Arrived 📍</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {supervisorMetrics.arrived} <span className="text-xs font-bold text-slate-400">Geofenced Sites</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Completed ✅</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {supervisorMetrics.completed} <span className="text-xs font-bold text-slate-400">Visits Logged</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Field Distance ⚡</span>
            <Zap className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl font-black text-teal-600 dark:text-teal-400">
            {supervisorMetrics.totalKm.toFixed(1)} <span className="text-xs font-bold text-slate-400">KM</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs">
        <div className="md:col-span-5 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">Engineer:</span>
          <select
            value={selectedEngineerName}
            onChange={(e) => setSelectedEngineerName(e.target.value)}
            className="w-full text-xs font-bold p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="all">👥 All Engineers (All Radar Logs)</option>
            {engineers.map(e => (
              <option key={e.id} value={e.name}>
                👤 {e.name} ({e.work_profile || 'Field Engineer'})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by engineer, start/destination site, or ticket #..."
            className="w-full text-xs p-2.5 pl-9 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Map + Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leaflet Map Stage */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden p-3 relative">
            <div 
              ref={mapContainerRef} 
              className="w-full h-[460px] rounded-xl z-0" 
            />

            {!activeVisit && (
              <div className="absolute inset-3 z-10 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-6 text-center rounded-xl">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl max-w-md space-y-3">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
                    🛵
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">No Active Tracking Logs Present</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Live GPS field tracking logs are currently clear. When engineers submit location check-ins from their mobile portal, active routes and motorcycle movement will appear on this radar map in real time.
                  </p>
                </div>
              </div>
            )}

            {/* Simulation Control HUD */}
            <div className="absolute top-6 right-6 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 max-w-xs w-full">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-black text-xs text-indigo-600 dark:text-indigo-400">
                  <span>🛵</span>
                  <span>Motorcycle Ride Simulator</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {isSimulating ? 'Riding Live' : 'Paused'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span>Route Progress</span>
                  <span>{Math.round(simProgress * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={simProgress}
                  onChange={(e) => setSimProgress(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-white transition-all shadow-xs cursor-pointer ${
                    isSimulating ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isSimulating ? 'Pause' : 'Start'}
                </button>

                <button
                  type="button"
                  onClick={() => { setSimProgress(0); setIsSimulating(true); }}
                  className="py-2 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Reset to Start"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart
                </button>

                <select
                  value={simSpeedKmH}
                  onChange={(e) => setSimSpeedKmH(Number(e.target.value))}
                  className="py-2 px-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-center cursor-pointer"
                >
                  <option value={30}>30 km/h</option>
                  <option value={40}>40 km/h</option>
                  <option value={60}>60 km/h</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-2 text-xs text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800/80 mt-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">🟢 <b>Start Point</b></span>
                <span className="flex items-center gap-1">🏁 <b>Destination</b></span>
                <span className="flex items-center gap-1">🛵 <b>Motorcycle Rider (Engineer)</b></span>
              </div>
              <div className="text-[11px] text-slate-400">
                Route Distance: <b className="text-indigo-600 dark:text-indigo-400">{activeVisit?.distanceKm || 0} KM</b>
              </div>
            </div>

          </div>
        </div>

        {/* Right Active Visit Details */}
        <div className="lg:col-span-4 space-y-4">
          {activeVisit ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Active Live Tracking
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active En-Route
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                  🛵
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {activeVisit.engineerName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Visit Logged: {activeVisit.visitDate} @ {activeVisit.visitTime}
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">🟢 From:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeVisit.startLocationName}</span>
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-rose-600 font-bold shrink-0">🏁 To:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeVisit.destinationLocationName}</span>
                </div>

                {activeVisit.ticketNumber && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                    <span className="text-indigo-600 font-bold shrink-0">🎫 Job Ticket:</span>
                    <span className="font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[11px]">
                      {activeVisit.ticketNumber}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Distance</span>
                  <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">{activeVisit.distanceKm} KM</span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated ETA</span>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-300">~{etaMins} Mins</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPlaybackVisit(activeVisit);
                    setPlaybackIndex(0);
                    setIsPlaybackPlaying(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Replay Journey Route History ⏯️
                </button>
              </div>

              {activeVisit.startCoords && activeVisit.destinationCoords && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${activeVisit.startCoords.lat},${activeVisit.startCoords.lng}&destination=${activeVisit.destinationCoords.lat},${activeVisit.destinationCoords.lng}&travelmode=two_wheeler`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Route on Google Maps
                </a>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">No visit logs available</p>
            </div>
          )}

          {/* Recent Visits List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Recent Field Visits ({filteredVisits.length})
              </h4>
              <span className="text-[10px] text-slate-400">Click to focus</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredVisits.map(v => (
                <div
                  key={v.id}
                  className={`p-2.5 rounded-xl border transition-all text-xs ${
                    activeVisit?.id === v.id
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-1.5 truncate">
                      <span>🛵</span>
                      <span>{v.engineerName}</span>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 shrink-0 font-black">{v.distanceKm} KM</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {v.startLocationName} ➔ {v.destinationLocationName}
                  </div>
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVisitId(v.id);
                        setSimProgress(0);
                        setIsSimulating(false);
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Focus Radar 🛵
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlaybackVisit(v);
                        setPlaybackIndex(0);
                        setIsPlaybackPlaying(true);
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" /> Replay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-extrabold uppercase">
                Admin Audit & GPS Logs
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {filteredVisits.length} Records Across {engineerWiseGrouped.length} Engineers
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Engineer-Wise Visit & Route History Logs
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportCSV()}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handlePrintVisitReport}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        </div>

        {engineerWiseGrouped.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xs font-bold">No visit records match the selected engineer or filter query.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {engineerWiseGrouped.map((group) => (
              <div 
                key={group.engineerName}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs"
              >
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      👤
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {group.engineerName}
                      </h4>
                      <p className="text-[11px] text-indigo-200/80">
                        {group.visits.length} Visit Logged Entries
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
                      Total Route Travel: {group.totalKm.toFixed(2)} KM
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3 pl-4">Date & Timing</th>
                        <th className="p-3">Start Origin</th>
                        <th className="p-3">Destination Site</th>
                        <th className="p-3 text-center">Distance (KM)</th>
                        <th className="p-3">Job Ticket / Purpose</th>
                        <th className="p-3 text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                      {group.visits.map((v) => (
                        <tr 
                          key={v.id}
                          className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors ${
                            activeVisit?.id === v.id ? 'bg-indigo-50/70 dark:bg-indigo-950/50' : ''
                          }`}
                        >
                          <td className="p-3 pl-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {v.visitDate}<br/>
                            <span className="text-[10px] text-slate-400 font-normal">⏰ {v.visitTime}</span>
                          </td>

                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                            <span className="text-emerald-600 font-bold">🟢</span> {v.startLocationName}
                          </td>

                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                            <span className="text-rose-600 font-bold">🏁</span> {v.destinationLocationName}
                          </td>

                          <td className="p-3 text-center font-black text-indigo-600 dark:text-indigo-400 text-sm whitespace-nowrap">
                            {v.distanceKm} KM
                          </td>

                          <td className="p-3">
                            {v.ticketNumber ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px] mb-0.5">
                                Ticket #{v.ticketNumber}
                              </span>
                            ) : null}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {v.notes || 'Routine Site Visit'}
                            </p>
                          </td>

                          <td className="p-3 text-right pr-4 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setPlaybackVisit(v);
                                  setPlaybackIndex(0);
                                  setIsPlaybackPlaying(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-[11px] hover:bg-teal-100 transition-colors cursor-pointer flex items-center gap-1"
                                title="Replay Journey Route History"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Replay ⏯️
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVisitId(v.id);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 transition-colors cursor-pointer"
                              >
                                Radar 🛵
                              </button>

                              <button
                                type="button"
                                onClick={() => setVisitToDelete(v)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title="Delete Visit Log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      </div>

      {/* ROUTE PLAYBACK & REPLAY MODAL */}
      {playbackVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-md">
                  🛵
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Journey Replay:</span> {playbackVisit.engineerName}
                  </h3>
                  <p className="text-[11px] text-indigo-200/80">
                    {playbackVisit.startLocationName} ➔ {playbackVisit.destinationLocationName} ({playbackVisit.distanceKm} KM)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPlaybackVisit(null);
                  setIsPlaybackPlaying(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              
              {/* Playback Map */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                <div 
                  ref={playbackMapContainerRef} 
                  className="w-full h-80 z-0" 
                />

                {/* Telemetry HUD Overlay */}
                <div className="absolute top-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-white text-xs space-y-1.5 shadow-xl max-w-xs">
                  <div className="flex items-center justify-between font-black border-b border-slate-800 pb-1 text-indigo-300">
                    <span>LIVE REPLAY TELEMETRY</span>
                    <span>Point {playbackIndex + 1} / {playbackTrackPoints.length}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <div>⏰ Time: <b className="text-amber-300 font-mono">{currentPlaybackPoint?.timestamp || '00:00:00'}</b></div>
                    <div>⚡ Speed: <b className="text-emerald-300 font-mono">{currentPlaybackPoint?.speedKmH || 0} km/h</b></div>
                    <div>🔋 Battery: <b className="text-teal-300 font-mono">{currentPlaybackPoint?.batteryPercent || 90}%</b></div>
                    <div>🎯 GPS Accuracy: <b className="text-indigo-300 font-mono">±{currentPlaybackPoint?.accuracyMeters || 4}m</b></div>
                    <div>🛡️ Mock GPS: <b className="text-emerald-400">Passed ✅</b></div>
                    <div>🌐 Network: <b className="text-emerald-400">Online 🟢</b></div>
                  </div>
                </div>
              </div>

              {/* Scrubbing & Controls Bar */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                
                {/* Timeline Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    <span>Route Progress Tracker</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {Math.round(((playbackIndex + 1) / playbackTrackPoints.length) * 100)}% ({((playbackVisit.distanceKm * (playbackIndex + 1)) / playbackTrackPoints.length).toFixed(1)} / {playbackVisit.distanceKm} KM)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, playbackTrackPoints.length - 1)}
                    value={playbackIndex}
                    onChange={(e) => setPlaybackIndex(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaybackPlaying(!isPlaybackPlaying)}
                      className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs ${
                        isPlaybackPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isPlaybackPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      {isPlaybackPlaying ? 'Pause Replay' : 'Play Replay'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlaybackIndex(0);
                        setIsPlaybackPlaying(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restart
                    </button>
                  </div>

                  {/* Multiplier */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Speed:</span>
                    {[1, 2, 5, 10].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPlaybackMultiplier(m)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                          playbackMultiplier === m
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Official Journey Audit Log ID: <b className="font-mono text-slate-800 dark:text-slate-200">{playbackVisit.id}</b>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPlaybackVisit(null);
                  setIsPlaybackPlaying(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 cursor-pointer"
              >
                Close Replay
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SINGLE VISIT DELETE CONFIRMATION MODAL */}
      {visitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Delete Visit Entry?</h3>
                <p className="text-xs text-slate-500">This action will remove the selected route record permanently.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-indigo-600 dark:text-indigo-400">👤 {visitToDelete.engineerName}</div>
              <div className="text-slate-700 dark:text-slate-300">
                🟢 <b>{visitToDelete.startLocationName}</b> ➔ 🔴 <b>{visitToDelete.destinationLocationName}</b>
              </div>
              <div className="text-amber-600 font-mono font-bold">
                Distance: {visitToDelete.distanceKm} KM ({visitToDelete.visitDate} @ {visitToDelete.visitTime})
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVisitToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSingleVisit(visitToDelete.id)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET ALL VISITS CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Reset All Live Tracking Logs?</h3>
                <p className="text-xs text-slate-500">This will delete all location visits across all field engineers.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
              ⚠️ Are you sure? All logged GPS routes, distances, and en-route tracking history will be cleared.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAllVisits}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Resetting...' : 'Yes, Clear All Logs'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
