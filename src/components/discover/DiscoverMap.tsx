"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RankedPlaceResult } from "@/lib/recommendations/ranking";

interface DiscoverMapProps {
  places: RankedPlaceResult[];
  destinationName: string;
  destinationCentre?: string;
  onSelectPlace: (placeId: string) => void;
}

export default function DiscoverMap({
  places,
  destinationName,
  onSelectPlace,
}: DiscoverMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<L.Marker[]>([]);

  // Default coordinate centers
  let centerLat = 28.6139;
  let centerLng = 77.2090;

  if (destinationName.toLowerCase().includes("jaipur")) {
    centerLat = 26.9124;
    centerLng = 75.7873;
  }

  // Parse points for places
  const placeMarkers = places
    .map((p) => {
      let lat: number | null = null;
      let lng: number | null = null;
      if (p.location && typeof p.location === "string" && p.location.includes("POINT")) {
        const parts = p.location.replace("POINT(", "").replace(")", "").trim().split(" ");
        lng = parseFloat(parts[0]);
        lat = parseFloat(parts[1]);
      }
      return { ...p, lat, lng };
    })
    .filter((p): p is typeof p & { lat: number; lng: number } => p.lat !== null && p.lng !== null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: true,
    });

    // OpenStreetMap Tile Layer with dark styling
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

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
  }, [centerLat, centerLng]);

  // Update place markers on map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    placeMarkers.forEach((p) => {
      const isGem = p.is_hidden_gem;
      const customIcon = L.divIcon({
        className: "",
        html: `
          <div style="
            background: ${isGem ? "#e8a838" : "#6C63FF"};
            color: ${isGem ? "#1a0800" : "#ffffff"};
            border-radius: 999px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            border: 2px solid #ffffff;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>${isGem ? "💎" : "📍"}</span>
            <span>${p.name}</span>
          </div>
        `,
        iconSize: [80, 26],
        iconAnchor: [40, 13],
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon })
        .addTo(map)
        .on("click", () => onSelectPlace(p.id));

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <h4 style="font-weight: 700; margin: 0 0 4px 0;">${p.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">Category: ${p.category}</p>
          <p style="margin: 0; font-size: 12px; color: #f59e0b; font-weight: 600;">★ ${p.avg_rating.toFixed(1)} (${p.n_ratings} ratings)</p>
        </div>
      `);

      markersRef.current.push(marker);
    });

    if (placeMarkers.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [places]);

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        position: "relative",
        height: 420,
        borderRadius: 16,
        border: "1px solid var(--border)",
      }}
    >
      <div
        ref={containerRef}
        className="wl-dark-map"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Place Pins Overlay Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          right: 12,
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          zIndex: 500,
        }}
      >
        {placeMarkers.slice(0, 10).map((p) => (
          <button
            key={p.id}
            onClick={() => {
              onSelectPlace(p.id);
              if (mapRef.current && p.lat && p.lng) {
                mapRef.current.flyTo([p.lat, p.lng], 15, { duration: 0.8 });
              }
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: p.is_hidden_gem ? "linear-gradient(135deg, #e8a838, #f59e0b)" : "rgba(34,31,74,0.95)",
              color: p.is_hidden_gem ? "#1a0800" : "#ffffff",
              border: p.is_hidden_gem ? "none" : "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "0.82rem",
              fontWeight: 700,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              backdropFilter: "blur(8px)",
            }}
          >
            <span>{p.is_hidden_gem ? "💎" : "📍"}</span>
            <span>{p.name}</span>
            <span style={{ opacity: 0.85, fontSize: "0.75rem" }}>★ {p.avg_rating.toFixed(1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
