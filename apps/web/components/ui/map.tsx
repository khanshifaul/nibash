"use client";

import { cn } from "@/lib/utils";

interface MapProps {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
}

export default function Map({ lat, lng, zoom = 15, className }: MapProps) {
  const src = `https://www.google.com/maps/embed/v1/place?key=&q=${lat},${lng}&z=${zoom}`;

  return (
    <iframe
      width="100%"
      height="100%"
      className={cn("border-0 rounded-lg", className)}
      src={src}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
