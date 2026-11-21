"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
  className?: string;
};

declare global {
  interface Window {
    google?: any;
    __nibashGoogleMapsLoading?: Promise<void>;
  }
}

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve();
  if (window.__nibashGoogleMapsLoading) return window.__nibashGoogleMapsLoading;
  window.__nibashGoogleMapsLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-nibash-google-maps="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.nibashGoogleMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
  return window.__nibashGoogleMapsLoading;
}

export default function LocationPicker({
  lat,
  lng,
  onChange,
  height = 320,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const initialLat = useRef(lat);
  const initialLng = useRef(lng);
  initialLat.current = lat;
  initialLng.current = lng;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
    if (!apiKey) {
      setError("Google Maps API key is missing (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).");
      return;
    }

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.maps) return;
        const center = {
          lat: Number.isFinite(initialLat.current) ? initialLat.current : 23.8103,
          lng: Number.isFinite(initialLng.current) ? initialLng.current : 90.4125,
        };
        if (!mapRef.current) {
          const map = new window.google.maps.Map(containerRef.current, {
            center,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          const marker = new window.google.maps.Marker({
            position: center,
            map,
            draggable: true,
          });
          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            if (!pos) return;
            onChangeRef.current(Number(pos.lat().toFixed(7)), Number(pos.lng().toFixed(7)));
          });
          map.addListener("click", (e: any) => {
            if (!e.latLng) return;
            marker.setPosition(e.latLng);
            onChangeRef.current(
              Number(e.latLng.lat().toFixed(7)),
              Number(e.latLng.lng().toFixed(7)),
            );
          });
          mapRef.current = map;
          markerRef.current = marker;
          setReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load Google Maps");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const nextLat = Number.isFinite(lat) ? lat : 23.8103;
    const nextLng = Number.isFinite(lng) ? lng : 90.4125;
    const pos = marker.getPosition();
    if (!pos || Math.abs(pos.lat() - nextLat) > 1e-7 || Math.abs(pos.lng() - nextLng) > 1e-7) {
      const next = { lat: nextLat, lng: nextLng };
      marker.setPosition(next);
      map.setCenter(next);
    }
  }, [lat, lng]);

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-lg border overflow-hidden bg-muted"
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {ready ? "Click the map or drag the pin to set the property location." : "Loading map…"}
        </p>
      )}
    </div>
  );
}
