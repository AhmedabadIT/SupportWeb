// Location and Distance Utility functions using Haversine formula

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Calculates realistic road travel route distance on Earth (accounting for road network factor ~1.28x)
 */
export function calculateRoadTravelDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): { km: number; miles: number } {
  if ((!lat1 && !lng1) || (!lat2 && !lng2)) {
    return { km: 0, miles: 0 };
  }
  const direct = calculateHaversineDistance(lat1, lng1, lat2, lng2);
  // Apply average urban/suburban road network routing multiplier (~1.28x)
  const roadKm = direct.km * 1.28;
  const roadMiles = roadKm * 0.621371;

  return {
    km: Number(roadKm.toFixed(2)),
    miles: Number(roadMiles.toFixed(2))
  };
}

/**
 * Legacy alias for distance calculation
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): { km: number; miles: number } {
  if ((!lat1 && !lng1) || (!lat2 && !lng2)) {
    return { km: 0, miles: 0 };
  }
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  const miles = km * 0.621371;

  return {
    km: Number(km.toFixed(2)),
    miles: Number(miles.toFixed(2))
  };
}

export const DEFAULT_HEADQUARTERS = {
  AHMEDABAD: { name: 'RO Ahmedabad HQ', lat: 23.0225, lng: 72.5714 },
  SURAT: { name: 'Surat Sub-RO', lat: 21.1702, lng: 72.8311 }
};

export interface OsrmRouteData {
  distanceKm: number;
  distanceMiles: number;
  durationMins: number;
  geometry: [number, number][]; // [lat, lng] array
  routeName: string;
}

export interface RouteOptionsResult {
  primary: OsrmRouteData;
  alternatives: OsrmRouteData[];
}

/**
 * Generate fallback winding road polyline coordinates between two points
 */
export function generateFallbackRoadGeometry(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  steps: number = 12
): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  // Offset vector perpendicular to the line
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const perpLat = -dLng * 0.15;
  const perpLng = dLat * 0.15;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier curve for realistic road curvature
    const currLat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * (midLat + perpLat) + t * t * lat2;
    const currLng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * (midLng + perpLng) + t * t * lng2;
    points.push([Number(currLat.toFixed(5)), Number(currLng.toFixed(5))]);
  }
  return points;
}

/**
 * Fetch real driving road route(s) from OSRM
 */
export async function fetchOsrmDrivingRoute(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<RouteOptionsResult | null> {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  if (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lng1 - lng2) < 0.0001) return null;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const parseRoute = (r: any, index: number): OsrmRouteData => {
      const distMeters = r.distance || 0;
      const km = Number((distMeters / 1000).toFixed(2));
      const miles = Number((km * 0.621371).toFixed(2));
      const durationMins = Math.round((r.duration || 0) / 60);

      const coords: [number, number][] = (r.geometry?.coordinates || []).map(
        ([gLng, gLat]: [number, number]) => [Number(gLat.toFixed(5)), Number(gLng.toFixed(5))] as [number, number]
      );

      const routeName = index === 0 ? 'Primary Driving Highway Route' : `Alternative Road Route ${index}`;

      return {
        distanceKm: km,
        distanceMiles: miles,
        durationMins,
        geometry: coords,
        routeName
      };
    };

    const primary = parseRoute(data.routes[0], 0);
    const alternatives = data.routes.slice(1).map((r: any, idx: number) => parseRoute(r, idx + 1));

    return {
      primary,
      alternatives
    };
  } catch (err) {
    console.warn('OSRM routing fetch failed or timed out:', err);
    return null;
  }
}

/**
 * Get current browser GPS location coordinates with friendly error handling
 */
export function getCurrentGpsPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const err = new Error("Geolocation is not supported by your browser");
      (err as any).code = 0;
      reject(err);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let msg = "Unable to acquire location";
        if (error.code === 1) { // PERMISSION_DENIED
          msg = "User denied Geolocation access. Please enable location permissions or use manual/preset location selection.";
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          msg = "GPS position unavailable. Please ensure location service is enabled on your device.";
        } else if (error.code === 3) { // TIMEOUT
          msg = "GPS request timed out. Please try again or select location on the map.";
        } else if (error.message) {
          msg = error.message;
        }
        const customErr = new Error(msg);
        (customErr as any).code = error.code;
        reject(customErr);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

