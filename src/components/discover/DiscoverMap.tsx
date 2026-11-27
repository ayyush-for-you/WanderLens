"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PlaceCategory } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ──────────────────────────────────────────────────────── */

/** Row returned by the get_places_geo RPC – defined locally, never touches database.ts */
export interface PlaceGeo {
  id: string;
  destination_id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  avg_rating: number;
  n_ratings: number;
  image_url: string | null;
  image_credit: string | null;
  image_license: string | null;
}

export interface DiscoverMapProps {
  destinationId: string;
  categoryFilter: PlaceCategory | "all";
  hoveredPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  /** Parent calls this so it can build the imageUrl lookup */
  onGeoLoaded?: (places: PlaceGeo[]) => void;
}

/* ─── Marker icon helpers ─────────────────────────────────────────── */

function buildIcon(name: string, highlighted: boolean) {
  const bg = highlighted ? "#ffffff" : "#6C63FF";
  const textColor = highlighted ? "#0b0f12" : "#ffffff";
  const shadow = highlighted
    ? "0 0 0 3px #6C63FF, 0 6px 18px rgba(0,0,0,0.6)"
    : "0 4px 12px rgba(0,0,0,0.4)";
  const truncated = name.length > 18 ? name.slice(0, 16) + "\u2026" : name;
  const fontSize = highlighted ? "12px" : "11px";
  const border = highlighted ? "2px solid #6C63FF" : "2px solid rgba(255,255,255,0.6)";

  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:${textColor};border-radius:999px;padding:4px 8px;font-size:${fontSize};font-weight:700;display:flex;align-items:center;gap:4px;box-shadow:${shadow};border:${border};cursor:pointer;white-space:nowrap;">📍 ${truncated}</div>`,
    iconSize: [90, 28],
    iconAnchor: [45, 28],
  });
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function DiscoverMap({
  destinationId,
  categoryFilter,
  hoveredPlaceId,
  onSelectPlace,
  onGeoLoaded,
}: DiscoverMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerMapRef = useRef<Map<string, { marker: L.Marker; place: PlaceGeo }>>(new Map());
  const allPlacesRef = useRef<PlaceGeo[]>([]);
  const categoryRef  = useRef(categoryFilter);
  const hoveredRef   = useRef(hoveredPlaceId);

  // Keep refs in sync for use inside callbacks
  categoryRef.current = categoryFilter;
  hoveredRef.current  = hoveredPlaceId;

  /** Re-render visible markers honouring the current category filter */
  const syncMarkers = useCallback(
    (places: PlaceGeo[], filter: PlaceCategory | "all", highlightId: string | null) => {
      const map = mapRef.current;
      if (!map) return;

      // Clear all existing markers
      markerMapRef.current.forEach(({ marker }) => marker.remove());
      markerMapRef.current.clear();

      const visible = filter === "all" ? places : places.filter((p) => p.category === filter);

      visible.forEach((p) => {
        const isHighlighted = p.id === highlightId;
        const marker = L.marker([p.lat, p.lng], {
          icon: buildIcon(p.name, isHighlighted),
          zIndexOffset: isHighlighted ? 1000 : 0,
        })
          .addTo(map)
          .on("click", () => {
            onSelectPlace(p.id);
            map.panTo([p.lat, p.lng], { animate: true });
          });

        marker.bindTooltip(
          `<strong>${p.name}</strong><br/>★ ${p.avg_rating.toFixed(1)} (${p.n_ratings})`,
          { sticky: true, offset: [0, -10] }
        );

        markerMapRef.current.set(p.id, { marker, place: p });
      });

      // Fit bounds
      if (visible.length > 1) {
        const group = L.featureGroup(
          Array.from(markerMapRef.current.values()).map((v) => v.marker)
        );
        map.fitBounds(group.getBounds().pad(0.18));
      } else if (visible.length === 1) {
        const { place } = Array.from(markerMapRef.current.values())[0];
        map.setView([place.lat, place.lng], 15, { animate: true });
      }
    },
    [onSelectPlace]
  );

  /* ── Initialise Leaflet map (once) ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629], // India centre while geo loads
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "\u00a9 OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 250);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
      markerMapRef.current.clear();
    };
  }, []); // runs once

  /* ── Fetch geo when destinationId changes ── */
  useEffect(() => {
    if (!destinationId) return;
    let cancelled = false;

    const supabase = createClient();
    supabase
      .rpc("get_places_geo", { p_destination_id: destinationId })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[DiscoverMap] get_places_geo error:", error.message);
          return;
        }
        const places = (data as PlaceGeo[]) ?? [];
        allPlacesRef.current = places;
        onGeoLoaded?.(places);
        syncMarkers(places, categoryRef.current, hoveredRef.current);
      });

    return () => { cancelled = true; };
    // Intentionally not listing categoryFilter / hoveredPlaceId — their effects handle updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationId, syncMarkers]);

  /* ── Re-draw markers when filter changes ── */
  useEffect(() => {
    if (!mapRef.current || allPlacesRef.current.length === 0) return;
    syncMarkers(allPlacesRef.current, categoryFilter, hoveredPlaceId);
  }, [categoryFilter, syncMarkers, hoveredPlaceId]);

  /* ── Highlight marker on hover without full redraw ── */
  useEffect(() => {
    if (!mapRef.current) return;
    markerMapRef.current.forEach(({ marker, place }) => {
      const isHighlighted = place.id === hoveredPlaceId;
      marker.setIcon(buildIcon(place.name, isHighlighted));
      marker.setZIndexOffset(isHighlighted ? 1000 : 0);
    });
    if (hoveredPlaceId) {
      const entry = markerMapRef.current.get(hoveredPlaceId);
      if (entry) {
        mapRef.current.panTo([entry.place.lat, entry.place.lng], { animate: true });
      }
    }
  }, [hoveredPlaceId]);

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        position: "relative",
        isolation: "isolate",
        zIndex: 0,
        height: "clamp(360px, 60vh, 640px)",
        borderRadius: 16,
        border: "1px solid var(--border)",
      }}
    >
      <div
        ref={containerRef}
        className="wl-dark-map"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
