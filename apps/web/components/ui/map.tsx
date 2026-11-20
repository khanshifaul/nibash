"use client";

interface MapProps {
  lat?: number | null;
  lng?: number | null;
  address?: string;
  className?: string;
  height?: number;
  zoom?: number;
}

/**
 * Simple embedded Google Maps component.
 * Uses Maps Embed API when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set, otherwise
 * falls back to a keyless maps.google.com embed to avoid "API key required" errors.
 */
export default function Map({
  lat,
  lng,
  address,
  className = "",
  height = 300,
  zoom = 16,
}: MapProps) {
  const hasCoords = lat != null && lng != null;
  const location = hasCoords
    ? `${lat},${lng}`
    : address
      ? encodeURIComponent(address)
      : "Dhaka,Bangladesh";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  const src = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${location}&zoom=${zoom}`
    : hasCoords
      ? `https://maps.google.com/maps?q=${location}&z=${zoom}&output=embed`
      : `https://maps.google.com/maps?q=${location}&output=embed`;

  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      className={`rounded-lg border-0 ${className}`.trim()}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      title="Location map"
    />
  );
}
