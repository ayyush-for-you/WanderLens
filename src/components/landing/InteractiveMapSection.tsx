"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Compass, MapPin, ArrowRight } from "lucide-react";

// Dynamically import Leaflet map preview to avoid SSR issues — UNCHANGED
const LandingMap = dynamic(() => import("./LandingMapInner"), { ssr: false });

// ── Data unchanged ──────────────────────────────────────────────────────────
const MAP_MONUMENTS = [
  {
    id: 1,
    name: "Hawa Mahal",
    city: "Jaipur",
    state: "Rajasthan",
    lat: 26.9239,
    lng: 75.8267,
    era: "1799 AD · Rajput Era",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600",
  },
  {
    id: 2,
    name: "Taj Mahal",
    city: "Agra",
    state: "Uttar Pradesh",
    lat: 27.1751,
    lng: 78.0421,
    era: "1631 AD · Mughal Golden Age",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600",
  },
  {
    id: 3,
    name: "Qutub Minar",
    city: "New Delhi",
    state: "Delhi",
    lat: 28.5244,
    lng: 77.1855,
    era: "1192 AD · Delhi Sultanate",
    image: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=600",
  },
  {
    id: 4,
    name: "Red Fort",
    city: "Old Delhi",
    state: "Delhi",
    lat: 28.6562,
    lng: 77.241,
    era: "1638 AD · Mughal Imperial",
    image: "https://images.unsplash.com/photo-1592635196078-9ffc8f654b9d?w=600",
  },
  {
    id: 5,
    name: "Humayun's Tomb",
    city: "New Delhi",
    state: "Delhi",
    lat: 28.5933,
    lng: 77.2507,
    era: "1558 AD · Mughal Precursor",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600",
  },
];

// ── Component ───────────────────────────────────────────────────────────────
export default function InteractiveMapSection() {
  // State and onSelect handler unchanged
  const [selectedMonument, setSelectedMonument] = useState(MAP_MONUMENTS[0]);

  return (
    <section
      id="interactive-map"
      style={{
        background: "var(--ink)",
        color: "var(--text)",
        padding: "clamp(80px, 10vw, 144px) clamp(20px, 3.4vw, 52px)",
        position: "relative",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* Section heading */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ width: 32, height: 1, background: "#B99A65", display: "block" }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  color: "#B99A65",
                  textTransform: "uppercase",
                }}
              >
                Cartographic Intelligence
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 400,
                lineHeight: 1.15,
                color: "var(--text)",
              }}
            >
              The World Is Yours{" "}
              <span style={{ fontStyle: "italic", color: "#B99A65", fontWeight: 300 }}>
                to Explore.
              </span>
            </h2>
          </div>

          <Link
            href="/discover"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              padding: "0 20px",
              borderRadius: 999,
              background: "#B99A65",
              color: "#0b1013",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              transition: "background 0.25s, transform 0.25s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#caa974";
              el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#B99A65";
              el.style.transform = "";
            }}
          >
            <Compass style={{ width: 14, height: 14 }} />
            <span>Open Dedicated Map Room</span>
          </Link>
        </div>

        {/* Map frame — LandingMap and onSelect handler untouched */}
        <div
          style={{
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--line)",
            boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
            height: 560,
            background: "#0E1522",
          }}
        >
          <LandingMap
            monuments={MAP_MONUMENTS}
            onSelect={(m) => setSelectedMonument(m)}
          />

          {/* Floating monument panel — motion animation unchanged */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={selectedMonument.id}
            style={{
              position: "absolute",
              bottom: 24,
              left: 24,
              right: 24,
              maxWidth: 420,
              zIndex: 1000,
              background: "var(--panel)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedMonument.image}
                  alt={selectedMonument.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: 10,
                    color: "#B99A65",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  {selectedMonument.era}
                </span>
                <h4
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  {selectedMonument.name}
                </h4>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MapPin style={{ width: 11, height: 11, color: "#B99A65" }} />
                  <span>
                    {selectedMonument.city}, {selectedMonument.state} ·{" "}
                    {selectedMonument.lat.toFixed(4)}°N, {selectedMonument.lng.toFixed(4)}°E
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Coordinates Verified</span>
              <Link
                href="/scan"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "#B99A65",
                  color: "#0b1013",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.25s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "#caa974")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "#B99A65")
                }
              >
                <span>Scan Site</span>
                <ArrowRight style={{ width: 12, height: 12 }} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
