"use client";

import { useEffect, useRef } from "react";
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

  // Parse destination coordinates (default Delhi if not parsed)
  let centerLat = 28.6139;
  let centerLng = 77.209;

  if (destinationName.toLowerCase().includes("jaipur")) {
    centerLat = 26.9124;
    centerLng = 75.7873;
  }

  // Parse points for places
  const placeMarkers = places
    .map((p) => {
      let lat = null;
      let lng = null;
      if (p.location && typeof p.location === "string" && p.location.includes("POINT")) {
        const parts = p.location.replace("POINT(", "").replace(")", "").trim().split(" ");
        lng = parseFloat(parts[0]);
        lat = parseFloat(parts[1]);
      }
      return {
        ...p,
        lat,
        lng,
      };
    })
    .filter((p) => p.lat !== null && p.lng !== null);

  return (
    <div
      ref={containerRef}
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        position: "relative",
        height: 380,
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "#181512",
      }}
    >
      {/* Interactive OpenStreetMap Embed */}
      <iframe
        title={`Map of ${destinationName}`}
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.12}%2C${centerLat - 0.08}%2C${centerLng + 0.12}%2C${centerLat + 0.08}&layer=mapnik&marker=${centerLat}%2C${centerLng}`}
        style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(95%)" }}
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
          zIndex: 20,
        }}
      >
        {placeMarkers.slice(0, 10).map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPlace(p.id)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: p.is_hidden_gem ? "var(--gradient-gold)" : "#221f1c",
              color: p.is_hidden_gem ? "#1a0800" : "var(--text-primary)",
              border: p.is_hidden_gem ? "none" : "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "0.8rem",
              fontWeight: 700,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
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

