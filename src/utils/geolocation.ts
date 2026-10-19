/**
 * Browser Geolocation API wrapper for real GPS coordinates and accuracy.
 */

export interface GpsLocation {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  timestamp: number;
  address?: string;
}

/**
 * Acquire current real device GPS location with high accuracy.
 */
export async function getCurrentGpsPosition(): Promise<GpsLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser/device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let address: string | undefined;

        try {
          address = await reverseGeocode(latitude, longitude);
        } catch {
          address = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;
        }

        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          timestamp: pos.timestamp,
          address,
        });
      },
      (err) => {
        let msg = 'Failed to retrieve GPS location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser settings to view nearby tasks.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000,
      },
    );
  });
}

/**
 * Reverse geocode coordinates to a human-readable address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'ChaseHorse-ERP/1.0',
        },
      },
    );
    if (!res.ok) throw new Error('Geocoding response not ok');
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  } catch {
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  }
}
