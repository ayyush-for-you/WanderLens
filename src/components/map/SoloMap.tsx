"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SoloMapProps {
  coords: { lat: number; lng: number } | null;
}

// Fix Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function SoloMap({ coords }: SoloMapProps) {
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapType, setMapType] = useState<"google" | "dark">("google");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = coords?.lat ?? 28.6139;
    const initialLng = coords?.lng ?? 77.2090;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
    });

    // OpenStreetMap Tile Layer with dark styling
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Call invalidateSize so dimensions render smoothly
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker when coords change
  useEffect(() => {
    if (!mapRef.current || !coords) return;
    const map = mapRef.current;

    const pulsingIcon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:2px;border-radius:50%;background:#4285F4;border:2px solid #ffffff;box-shadow:0 0 12px rgba(66,133,244,0.8);"></div>
          <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(66,133,244,0.4);animation:pulse-ring 2s ease-out infinite;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
      map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 14), { duration: 0.5 });
    } else {
      markerRef.current = L.marker([coords.lat, coords.lng], { icon: pulsingIcon })
        .addTo(map)
        .bindPopup("📍 <b>Your Current Location</b><br/>" + coords.lat.toFixed(4) + "°N, " + coords.lng.toFixed(4) + "°E");
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1 });
    }
  }, [coords]);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 64px - 36px)", minHeight: 400 }}>
      <div
        ref={containerRef}
        className="wl-dark-map"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
