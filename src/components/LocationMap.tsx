import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  fetchOsrmDrivingRoute, 
  generateFallbackRoadGeometry, 
  OsrmRouteData, 
  RouteOptionsResult,
  calculateRoadTravelDistance
} from '../utils/locationUtils';

// Import leaflet CSS dynamically if not present
if (typeof document !== 'undefined') {
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
}

interface LocationMapProps {
  startCoords: { lat: number; lng: number };
  destCoords: { lat: number; lng: number };
  startName: string;
  destName: string;
  distanceKm: number;
  distanceMiles: number;
  onSelectStartCoords: (lat: number, lng: number, name?: string) => void;
  onSelectDestCoords: (lat: number, lng: number, name?: string) => void;
  onGetGpsStart?: () => void;
  onGetGpsDest?: () => void;
  onRouteCalculated?: (distanceKm: number, distanceMiles: number, routeName?: string) => void;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  startCoords,
  destCoords,
  startName,
  destName,
  distanceKm,
  distanceMiles,
  onSelectStartCoords,
  onSelectDestCoords,
  onGetGpsStart,
  onGetGpsDest,
  onRouteCalculated
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const activePolylineRef = useRef<L.Polyline | null>(null);
  const altPolylinesRef = useRef<L.Polyline[]>([]);
  const liveGpsMarkerRef = useRef<L.Marker | null>(null);

  // Click Target Mode: 'start' | 'dest'
  const [clickMode, setClickMode] = useState<'start' | 'dest'>('start');

  // OSRM Routing States
  const [routeOptions, setRouteOptions] = useState<RouteOptionsResult | null>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const [isFetchingRoute, setIsFetchingRoute] = useState<boolean>(false);
  const [activeGeometry, setActiveGeometry] = useState<[number, number][]>([]);

  // Live GPS Tracking States
  const [isLiveGpsTracking, setIsLiveGpsTracking] = useState<boolean>(false);
  const [livePosition, setLivePosition] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const hasStart = startCoords.lat !== 0 || startCoords.lng !== 0;
  const hasDest = destCoords.lat !== 0 || destCoords.lng !== 0;

  // Custom Icon SVGs for Start, Destination & Live Tracker Pins
  const startIcon = L.divIcon({
    className: 'custom-map-pin-start',
    html: `
      <div style="background-color: #10b981; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; border: 3px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.4); font-size: 15px;">
        A
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const destIcon = L.divIcon({
    className: 'custom-map-pin-dest',
    html: `
      <div style="background-color: #ef4444; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; border: 3px solid white; box-shadow: 0 4px 12px rgba(239,68,68,0.4); font-size: 15px;">
        B
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const createLiveRiderIcon = (label: string = "Rider Live GPS") => L.divIcon({
    className: 'custom-live-rider-pin',
    html: `
      <div style="position: relative; display: inline-block;">
        <div style="position: absolute; -10px; left: -10px; right: -10px; bottom: -10px; top: -10px; border-radius: 999px; background: rgba(99, 102, 241, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background-color: #4f46e5; color: white; padding: 5px 12px; border-radius: 999px; font-weight: 800; font-size: 11px; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(79,70,229,0.5); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
          <span style="font-size: 14px;">🛵</span>
          <span>${label}</span>
        </div>
      </div>
    `,
    iconSize: [170, 32],
    iconAnchor: [85, 16]
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const initialLat = hasStart ? startCoords.lat : (hasDest ? destCoords.lat : 23.0225);
      const initialLng = hasStart ? startCoords.lng : (hasDest ? destCoords.lng : 72.5714);

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([initialLat, initialLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
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

  // Map Click Listener
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const formattedLat = Number(lat.toFixed(5));
      const formattedLng = Number(lng.toFixed(5));

      if (clickMode === 'start') {
        onSelectStartCoords(formattedLat, formattedLng, `Map Pin Start (${formattedLat}, ${formattedLng})`);
      } else {
        onSelectDestCoords(formattedLat, formattedLng, `Map Pin Destination (${formattedLat}, ${formattedLng})`);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [clickMode, onSelectStartCoords, onSelectDestCoords]);

  // Fetch Driving Routes when Start & Dest are set
  useEffect(() => {
    if (!hasStart || !hasDest) {
      setRouteOptions(null);
      setActiveGeometry([]);
      return;
    }

    let isMounted = true;
    setIsFetchingRoute(true);

    fetchOsrmDrivingRoute(startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng)
      .then((res) => {
        if (!isMounted) return;
        setIsFetchingRoute(false);
        if (res && res.primary) {
          setRouteOptions(res);
          setSelectedRouteIdx(0);
          setActiveGeometry(res.primary.geometry);
          if (onRouteCalculated) {
            onRouteCalculated(res.primary.distanceKm, res.primary.distanceMiles, res.primary.routeName);
          }
        } else {
          // Fallback Curved Geometry
          const fallbackGeom = generateFallbackRoadGeometry(startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng);
          const fallbackDist = calculateRoadTravelDistance(startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng);
          const fallbackRouteData: OsrmRouteData = {
            distanceKm: fallbackDist.km,
            distanceMiles: fallbackDist.miles,
            durationMins: Math.round((fallbackDist.km / 40) * 60),
            geometry: fallbackGeom,
            routeName: 'Estimated Road Driving Path'
          };
          setRouteOptions({ primary: fallbackRouteData, alternatives: [] });
          setSelectedRouteIdx(0);
          setActiveGeometry(fallbackGeom);
          if (onRouteCalculated) {
            onRouteCalculated(fallbackDist.km, fallbackDist.miles, 'Estimated Road Driving Path');
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsFetchingRoute(false);
        const fallbackGeom = generateFallbackRoadGeometry(startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng);
        const fallbackDist = calculateRoadTravelDistance(startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng);
        setRouteOptions({
          primary: {
            distanceKm: fallbackDist.km,
            distanceMiles: fallbackDist.miles,
            durationMins: Math.round((fallbackDist.km / 40) * 60),
            geometry: fallbackGeom,
            routeName: 'Estimated Road Driving Path'
          },
          alternatives: []
        });
        setActiveGeometry(fallbackGeom);
      });

    return () => {
      isMounted = false;
    };
  }, [startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng, hasStart, hasDest]);

  // Handle Changing Selected Route Option
  const handleSelectRouteOption = (idx: number) => {
    if (!routeOptions) return;
    const allRoutes = [routeOptions.primary, ...routeOptions.alternatives];
    const chosen = allRoutes[idx];
    if (!chosen) return;

    setSelectedRouteIdx(idx);
    setActiveGeometry(chosen.geometry);
    if (onRouteCalculated) {
      onRouteCalculated(chosen.distanceKm, chosen.distanceMiles, chosen.routeName);
    }
  };

  // Render Markers and Road Polylines on Leaflet Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous elements
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }
    if (activePolylineRef.current) {
      map.removeLayer(activePolylineRef.current);
      activePolylineRef.current = null;
    }
    altPolylinesRef.current.forEach(p => map.removeLayer(p));
    altPolylinesRef.current = [];

    const bounds = L.latLngBounds([]);

    // 1. Start Marker
    if (hasStart) {
      const marker = L.marker([startCoords.lat, startCoords.lng], {
        icon: startIcon,
        draggable: true
      }).addTo(map);

      marker.bindPopup(`<b>Start Origin (A)</b><br/>${startName || 'Start Location'}<br/>Lat: ${startCoords.lat}, Lng: ${startCoords.lng}`);
      marker.on('dragend', (e) => {
        const newPos = (e.target as L.Marker).getLatLng();
        onSelectStartCoords(Number(newPos.lat.toFixed(5)), Number(newPos.lng.toFixed(5)), `Dragged Pin (${newPos.lat.toFixed(5)}, ${newPos.lng.toFixed(5)})`);
      });

      startMarkerRef.current = marker;
      bounds.extend([startCoords.lat, startCoords.lng]);
    }

    // 2. Destination Marker
    if (hasDest) {
      const marker = L.marker([destCoords.lat, destCoords.lng], {
        icon: destIcon,
        draggable: true
      }).addTo(map);

      marker.bindPopup(`<b>Destination Site (B)</b><br/>${destName || 'Destination Location'}<br/>Lat: ${destCoords.lat}, Lng: ${destCoords.lng}`);
      marker.on('dragend', (e) => {
        const newPos = (e.target as L.Marker).getLatLng();
        onSelectDestCoords(Number(newPos.lat.toFixed(5)), Number(newPos.lng.toFixed(5)), `Dragged Pin (${newPos.lat.toFixed(5)}, ${newPos.lng.toFixed(5)})`);
      });

      destMarkerRef.current = marker;
      bounds.extend([destCoords.lat, destCoords.lng]);
    }

    // 3. Render Road Polylines (Primary & Alternatives)
    if (hasStart && hasDest && routeOptions) {
      const allRoutes = [routeOptions.primary, ...routeOptions.alternatives];

      // Draw non-selected alternative routes in translucent grey/amber
      allRoutes.forEach((r, idx) => {
        if (idx === selectedRouteIdx) return;
        const altLine = L.polyline(r.geometry, {
          color: '#94a3b8',
          weight: 4,
          opacity: 0.6,
          dashArray: '6, 6'
        }).addTo(map);

        altLine.bindTooltip(`Alternative Route: ${r.distanceKm} KM (~${r.durationMins}m)`, { sticky: true });
        altLine.on('click', () => handleSelectRouteOption(idx));
        altPolylinesRef.current.push(altLine);
      });

      // Draw active selected route polyline in vibrant indigo
      const activeRoute = allRoutes[selectedRouteIdx] || routeOptions.primary;
      const activeLine = L.polyline(activeRoute.geometry, {
        color: '#4f46e5',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      activeLine.bindTooltip(`Selected Road Path: ${activeRoute.distanceKm} KM (~${activeRoute.durationMins} min drive)`, { sticky: true });
      activePolylineRef.current = activeLine;

      // Extend bounds to active geometry
      activeRoute.geometry.forEach(pt => bounds.extend(pt));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (hasStart) {
      map.setView([startCoords.lat, startCoords.lng], 14);
    } else if (hasDest) {
      map.setView([destCoords.lat, destCoords.lng], 14);
    }
  }, [startCoords, destCoords, hasStart, hasDest, routeOptions, selectedRouteIdx, startName, destName]);

  // Live GPS Tracking via watchPosition
  const toggleLiveGpsTracking = () => {
    if (isLiveGpsTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveGpsTracking(false);
      setLivePosition(null);
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }
      setIsLiveGpsTracking(true);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          setLivePosition({ lat, lng });
        },
        (err) => {
          console.warn("Live GPS watch error:", err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  // Update Live Rider Marker on Leaflet
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (liveGpsMarkerRef.current) {
      map.removeLayer(liveGpsMarkerRef.current);
      liveGpsMarkerRef.current = null;
    }

    if (livePosition) {
      const label = "Live Engineer GPS";
      const marker = L.marker([livePosition.lat, livePosition.lng], {
        icon: createLiveRiderIcon(label),
        zIndexOffset: 1000
      }).addTo(map);

      marker.bindPopup(`<b>${label}</b><br/>Lat: ${livePosition.lat}, Lng: ${livePosition.lng}`);
      liveGpsMarkerRef.current = marker;

      if (isLiveGpsTracking) {
        map.panTo([livePosition.lat, livePosition.lng]);
      }
    }
  }, [livePosition, isLiveGpsTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const currentRoute = routeOptions ? [routeOptions.primary, ...routeOptions.alternatives][selectedRouteIdx] : null;

  return (
    <div className="space-y-3">
      
      {/* Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
        
        {/* Click Target Mode Buttons */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">Map Click Mode:</span>
          <div className="inline-flex p-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setClickMode('start')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                clickMode === 'start'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🟢 Set Start (A)
            </button>
            <button
              type="button"
              onClick={() => setClickMode('dest')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                clickMode === 'dest'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🔴 Set Destination (B)
            </button>
          </div>
        </div>

        {/* Live GPS Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {hasStart && hasDest && (
            <button
              type="button"
              onClick={toggleLiveGpsTracking}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isLiveGpsTracking
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm animate-pulse'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              <span>{isLiveGpsTracking ? '📡 Live GPS Tracking Active' : '📡 Track Live GPS'}</span>
            </button>
          )}

          {onGetGpsStart && (
            <button
              type="button"
              onClick={onGetGpsStart}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              📍 GPS Start
            </button>
          )}
          {onGetGpsDest && (
            <button
              type="button"
              onClick={onGetGpsDest}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-rose-50 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              📍 GPS Dest
            </button>
          )}
        </div>

      </div>

      {/* Available Road Route Choices Selector */}
      {routeOptions && (
        <div className="p-2.5 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <span>🛣️ Road Network Path Selection</span>
              {isFetchingRoute && <span className="text-[10px] text-indigo-600 animate-pulse">(Calculating road route...)</span>}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              Real driving path (not direct straight line)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[routeOptions.primary, ...routeOptions.alternatives].map((rt, idx) => {
              const isSelected = selectedRouteIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectRouteOption(idx)}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{idx === 0 ? '🚗 Main Route' : `🛤️ Alt Route ${idx}`}</span>
                  <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                    {rt.distanceKm} KM (~{rt.durationMins} min)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Element */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-[380px] z-0" />

        {/* Distance Badge Overlay on Map */}
        {hasStart && hasDest && (
          <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700 shadow-lg text-xs space-y-1 max-w-[220px]">
            <div className="font-bold text-indigo-400 flex items-center justify-between gap-1">
              <span>🛣️ Driving Road Route</span>
              {isFetchingRoute && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {currentRoute ? currentRoute.distanceKm : distanceKm} KM
              <span className="text-xs text-slate-300 font-normal ml-1">({currentRoute ? currentRoute.distanceMiles : distanceMiles} mi)</span>
            </div>
            <div className="text-[11px] text-teal-300 font-semibold">
              ⏱️ ~{currentRoute ? currentRoute.durationMins : Math.round((distanceKm / 40) * 60)} min drive
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentRoute?.routeName || 'Road Network Polyline'}
            </div>
          </div>
        )}

        {/* Live GPS Telemetry Overlay Banner */}
        {livePosition && (
          <div className="absolute top-3 left-3 z-10 bg-indigo-950/90 backdrop-blur-md text-white p-2.5 rounded-xl border border-indigo-700/80 shadow-xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>📡 REAL-TIME LIVE GPS ACTIVE</span>
            </div>
            <div className="text-[11px] font-mono text-slate-200">
              Pos: {livePosition.lat.toFixed(5)}, {livePosition.lng.toFixed(5)}
            </div>
          </div>
        )}

        {/* Helper Instructions at bottom of map */}
        <div className="absolute bottom-2 left-2 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-[10px] font-semibold text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
          💡 Click map to set <span className={clickMode === 'start' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{clickMode === 'start' ? 'Start (A)' : 'Destination (B)'}</span>. Drag markers or select alternative road paths.
        </div>
      </div>

    </div>
  );
};

