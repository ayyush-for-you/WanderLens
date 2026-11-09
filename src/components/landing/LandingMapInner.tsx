"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MonumentItem {
  id: number;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  era: string;
  image: string;
}

interface LandingMapInnerProps {
  monuments: MonumentItem[];
  onSelect: (m: MonumentItem) => void;
}

export default function LandingMapInner({ monuments, onSelect }: LandingMapInnerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef       = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [27.5, 77.0],
      zoom: 7,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    // DarkMatter / Google tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    monuments.forEach((mon) => {
      const pinIcon = L.divIcon({
        className: "custom-gold-marker",
        html: `
          <div style="
            background: #B99A65;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 16px rgba(185, 154, 101, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #101B2B;
            font-weight: 800;
            font-size: 11px;
            cursor: pointer;
          ">
            🏛
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([mon.lat, mon.lng], { icon: pinIcon }).addTo(map);
      marker.on("click", () => {
        onSelect(mon);
        map.flyTo([mon.lat, mon.lng], Math.max(map.getZoom(), 9), { duration: 0.6 });
      });
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, [monuments, onSelect]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
