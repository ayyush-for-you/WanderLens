"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface GroupMapMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface GroupMapProps {
  locations: GroupMapMember[];
  selectedUserId: string | null;
  defaultCenter: { lat: number; lng: number };
  onSelectMember: (member: GroupMapMember) => void;
}

export default function GroupMap({
  locations,
  selectedUserId,
  defaultCenter,
  onSelectMember,
}: GroupMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const onSelectRef = useRef(onSelectMember);
  onSelectRef.current = onSelectMember;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
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
  }, [defaultCenter.lat, defaultCenter.lng]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    locations.forEach((loc) => {
      const isSelected = loc.user_id === selectedUserId;
      const initial = (loc.display_name || "M").charAt(0).toUpperCase();
      const ringColor = isSelected ? "#B99A65" : "#00C9A7";

      const memberIcon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;display:flex;align-items:center;gap:6px;transform:translate(-14px,-14px);">
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: ${ringColor};
              color: #0b1013;
              border: 2px solid #ffffff;
              box-shadow: 0 0 14px ${isSelected ? "rgba(185,154,101,0.85)" : "rgba(0,201,167,0.7)"};
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 12px;
              cursor: pointer;
            ">${initial}</div>
            <span style="
              background: rgba(14,19,23,0.92);
              color: #ffffff;
              border: 1px solid rgba(255,255,255,0.14);
              border-radius: 999px;
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 500;
              white-space: nowrap;
              box-shadow: 0 4px 12px rgba(0,0,0,0.45);
            ">${loc.display_name}</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: memberIcon })
        .addTo(map)
        .on("click", () => onSelectRef.current(loc));

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 2px 4px;">
          <div style="font-weight: 600; margin-bottom: 2px;">${loc.display_name}</div>
          <div style="font-size: 11px; opacity: 0.75;">${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E</div>
          <div style="font-size: 11px; color: #00C9A7; margin-top: 2px;">Updated ${new Date(loc.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
        </div>
      `);

      markersRef.current.push(marker);
    });

    if (selectedUserId) {
      const target = locations.find((l) => l.user_id === selectedUserId);
      if (target) {
        map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 15), {
          duration: 0.6,
        });
      }
    } else if (locations.length === 1) {
      map.flyTo([locations[0].latitude, locations[0].longitude], 14, { duration: 0.6 });
    } else if (locations.length > 1) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [locations, selectedUserId]);

  return (
    <div
      style={{
        position: "relative",
        isolation: "isolate",
        zIndex: 0,
        width: "100%",
        height: "100%",
        minHeight: 400,
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

