import { useEffect, useMemo, useState } from 'react';
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react';

type Position = { lat: number; lng: number; accuracy: number };

const fallbackPosition: Position = { lat: 12.9716, lng: 77.5946, accuracy: 0 };

export function LiveRadarCard() {
  const [position, setPosition] = useState<Position>(fallbackPosition);
  const [state, setState] = useState<'locating' | 'live' | 'unavailable'>('locating');

  useEffect(() => {
    if (!navigator.geolocation) {
      setState('unavailable');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude, accuracy: Math.round(coords.accuracy) });
        setState('live');
      },
      () => setState('unavailable'),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 12_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const mapUrl = useMemo(() => {
    const span = 0.018;
    const bbox = [position.lng - span, position.lat - span, position.lng + span, position.lat + span].join('%2C');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${position.lat}%2C${position.lng}`;
  }, [position]);

  const retryLocation = () => {
    setState('locating');
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude, accuracy: Math.round(coords.accuracy) });
        setState('live');
      },
      () => setState('unavailable'),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  };

  return (
    <section className="live-map" aria-label="Live field operations map">
      <header className="live-map__header">
        <span><LocateFixed size={14} /> Operations board</span>
        <small>{state === 'live' ? 'Live device position' : state === 'locating' ? 'Locating device' : 'Location unavailable'}</small>
      </header>
      <div className="live-map__canvas">
        <iframe title="Live OpenStreetMap location" src={mapUrl} loading="lazy" referrerPolicy="no-referrer" />
        <div className="live-map__target" aria-hidden="true"><span /></div>
        <div className="live-map__task">CH-24817 <b>18 m</b></div>
      </div>
      <footer className="live-map__footer">
        <div><MapPin size={14} /><span>{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</span></div>
        <button type="button" onClick={retryLocation} aria-label="Refresh live location"><RefreshCw size={14} /> Refresh</button>
        <small>{state === 'live' ? `GPS +/- ${position.accuracy} m` : 'Enable location for live mapping'}</small>
      </footer>
    </section>
  );
}
