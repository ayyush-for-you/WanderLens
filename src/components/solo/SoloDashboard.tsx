"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, AlertTriangle, Shield, BookmarkCheck, FileText, Navigation, Wifi } from "lucide-react";
import dynamic from "next/dynamic";
import SosTriggerModal from "@/components/sos/SosTriggerModal";
import type { Profile } from "@/types/database";

// Leaflet must be dynamically imported (no SSR)
const LeafletMap = dynamic(() => import("@/components/map/SoloMap"), { ssr: false });

interface SoloDashboardProps {
  profile: Profile;
}

export default function SoloDashboard({ profile }: SoloDashboardProps) {
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError]     = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sosOpen, setSosOpen]       = useState(false);
  const [recentPosts, setRecentPosts] = useState<Array<{ id: string; caption: string }>>([]);
  const watchId = useRef<number | null>(null);

  // GPS watcher with fallback
  useEffect(() => {
    // Immediate fallback default so map is never blank
    const fallbackTimer = setTimeout(() => {
      setCoords((curr) => curr ?? { lat: 28.6139, lng: 77.2090 });
      setLastUpdated(new Date());
    }, 2000);

    if (!navigator.geolocation) {
      setGpsError("GPS not supported; using default location");
      return () => clearTimeout(fallbackTimer);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        clearTimeout(fallbackTimer);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLastUpdated(new Date());
        setGpsError("");
      },
      (err) => {
        setGpsError(err.message + " (using default coordinates)");
        setCoords((curr) => curr ?? { lat: 28.6139, lng: 77.2090 });
        setLastUpdated(new Date());
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
    );

    return () => {
      clearTimeout(fallbackTimer);
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  // Fetch recent posts (non-blocking)
  useEffect(() => {
    fetch("/api/posts?limit=5&mine=true")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.posts)) setRecentPosts(d.posts); })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="dashboard-layout">
        {/* ─── Sidebar ─────────────────────────────────────────── */}
        <motion.aside
          className="dashboard-sidebar"
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          {/* My Location */}
          <div className="sidebar-section">
            <h3>📍 My Location</h3>
            {gpsError ? (
              <p style={{ fontSize: "0.8rem", color: "var(--prd-danger)" }}>{gpsError}</p>
            ) : coords ? (
              <>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                  Updated {lastUpdated ? formatRelative(lastUpdated) : "—"}
                </p>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="animate-spin" style={{ width: 14, height: 14, border: "2px solid rgba(108,99,255,0.3)", borderTopColor: "#6C63FF", borderRadius: "50%", display: "inline-block" }} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Acquiring GPS…</span>
              </div>
            )}
          </div>

          {/* Recent Posts */}
          <div className="sidebar-section">
            <h3>📝 Recent Posts</h3>
            {recentPosts.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No posts yet.</p>
            ) : (
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {recentPosts.slice(0, 5).map((p) => (
                  <li key={p.id} style={{ fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    • {p.caption || "Untitled post"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick links */}
          <div className="sidebar-section">
            <h3>🔖 Quick Links</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="/discover" style={{ fontSize: "0.85rem", color: "#a78bfa", textDecoration: "none" }}>→ Discover Places</a>
              <a href="/scan"     style={{ fontSize: "0.85rem", color: "#a78bfa", textDecoration: "none" }}>→ Scan Monument</a>
              <a href="/profile"  style={{ fontSize: "0.85rem", color: "#a78bfa", textDecoration: "none" }}>→ My Profile</a>
            </div>
          </div>
        </motion.aside>

        {/* ─── Map Area ─────────────────────────────────────────── */}
        <div className="dashboard-main" style={{ position: "relative" }}>
          {/* Map */}
          <div style={{ flex: 1, minHeight: 400 }}>
            <LeafletMap coords={coords} />
          </div>

          {/* SOS Floating Button */}
          <motion.button
            className="sos-btn"
            onClick={() => setSosOpen(true)}
            style={{ position: "absolute", bottom: 60, right: 20, zIndex: 50 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            aria-label="Trigger SOS"
            title="SOS"
          >
            🆘
          </motion.button>

          {/* Status bar */}
          <div className="status-bar">
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: coords ? "#4ade80" : "#fbbf24",
                  boxShadow: coords ? "0 0 6px rgba(74,222,128,0.6)" : "none",
                }}
              />
              {coords ? "GPS Active" : "Acquiring GPS"}
            </span>
            {lastUpdated && (
              <span>Last updated {formatRelative(lastUpdated)}</span>
            )}
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      <AnimatePresence>
        {sosOpen && (
          <SosTriggerModal
            coords={coords}
            onClose={() => setSosOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function formatRelative(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

