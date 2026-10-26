import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

const LEAVE_AFTER_MS = 2 * 60 * 1000; // must stay outside this long before we call it "left"

export function distanceMeters(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function currentPosition() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission was denied. Allow it in your browser or phone settings.');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
}

// Watches position while the app is open and reports 'at' / 'away' relative to the saved gym.
// Leaving needs a sustained reading outside 1.5× the radius, so GPS drift indoors doesn't trigger it.
export function useGymPresence(gym) {
  const [presence, setPresence] = useState({ status: 'unknown', distance: null, error: null });
  const awaySince = useRef(null);
  const active = gym?.enabled && gym.lat != null;

  useEffect(() => {
    if (!active) {
      setPresence({ status: 'unknown', distance: null, error: null });
      return;
    }
    let sub = null;
    let cancelled = false;
    // Positions can stop arriving once you stand still, so promote 'leaving' to 'away' on a timer too.
    const tick = setInterval(() => {
      if (awaySince.current && Date.now() - awaySince.current >= LEAVE_AFTER_MS) {
        setPresence((p) => (p.status === 'leaving' ? { ...p, status: 'away' } : p));
      }
    }, 15000);
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission was denied.');
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 15 },
          (pos) => {
            const d = distanceMeters(gym, { lat: pos.coords.latitude, lng: pos.coords.longitude });
            const slack = Math.min(pos.coords.accuracy || 0, 100);
            let status;
            if (d <= gym.radius + slack) {
              awaySince.current = null;
              status = 'at';
            } else if (d > gym.radius * 1.5 + slack) {
              awaySince.current = awaySince.current || Date.now();
              status = Date.now() - awaySince.current >= LEAVE_AFTER_MS ? 'away' : 'leaving';
            } else {
              status = 'near';
            }
            setPresence({ status, distance: Math.round(d), error: null });
          }
        );
        if (cancelled) sub.remove();
      } catch (e) {
        if (!cancelled) setPresence({ status: 'unknown', distance: null, error: e.message });
      }
    })();
    return () => {
      cancelled = true;
      clearInterval(tick);
      awaySince.current = null;
      sub?.remove();
    };
  }, [active, gym?.lat, gym?.lng, gym?.radius]);

  return presence;
}
