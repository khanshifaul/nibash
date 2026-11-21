"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
  className?: string;
};

type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;

export default function LocationPicker({
  lat,
  lng,
  onChange,
  height = 320,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const center = useMemo(() => {
    const safeLat = Number.isFinite(lat) ? lat : 23.8103;
    const safeLng = Number.isFinite(lng) ? lng : 90.4125;
    return [safeLat, safeLng] as [number, number];
  }, [lat, lng]);

  const initialCenter = useRef(center);
  initialCenter.current = center;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      // Fix default marker icons in bundlers
      // @ts-expect-error leaflet icon url patch
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) {
        const init = initialCenter.current;
        const map = L.map(containerRef.current, { center: init, zoom: 15 });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker(init, { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChangeRef.current(Number(pos.lat.toFixed(7)), Number(pos.lng.toFixed(7)));
        });
        map.on("click", (e) => {
          marker.setLatLng(e.latlng);
          onChangeRef.current(Number(e.latlng.lat.toFixed(7)), Number(e.latlng.lng.toFixed(7)));
        });

        mapRef.current = map;
        markerRef.current = marker;
        setReady(true);
        setTimeout(() => map.invalidateSize(), 0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const current = marker.getLatLng();
    if (Math.abs(current.lat - center[0]) > 1e-7 || Math.abs(current.lng - center[1]) > 1e-7) {
      marker.setLatLng(center);
      map.setView(center, map.getZoom());
    }
  }, [center]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-lg border overflow-hidden bg-muted"
      />
      <p className="text-xs text-muted-foreground">
        {ready ? "Click the map or drag the pin to set the property location." : "Loading map…"}
      </p>
    </div>
  );
}
