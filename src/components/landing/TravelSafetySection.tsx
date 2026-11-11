"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  AlertOctagon,
  Radio,
  Users,
  Bell,
  Lock,
  MapPin,
} from "lucide-react";

// ── Data unchanged ──────────────────────────────────────────────────────────
const SAFETY_PILLARS = [
  {
    icon: AlertOctagon,
    title: "Emergency SOS",
    color: "#E76F51",
    description:
      "1-second press-and-hold distress trigger broadcasts your exact GPS coordinates to nearby users within 2 km and stores to audit log.",
  },
  {
    icon: Radio,
    title: "Real-Time Location Sharing",
    color: "#00C9A7",
    description:
      "Encrypted WebSocket streams share your movement strictly within active group rooms — zero location leaks to non-members.",
  },
  {
    icon: Users,
    title: "Group Member Tracking",
    color: "#759BB7",
    description:
      "Keep visual contact with your travel party across crowded bazaars, remote ruins, and expansive temple corridors.",
  },
  {
    icon: Bell,
    title: "Priority Emergency Alerts",
    color: "#B99A65",
    description:
      "Instant broadcast alerts for emergency gatherings, regroup pings, or private direct member pings.",
  },
  {
    icon: MapPin,
    title: "Location Awareness",
    color: "#A3B5A0",
    description:
      "Orient your position on dark Google Maps, tracking your distance from known heritage coordinates.",
  },
  {
    icon: Lock,
    title: "Cloud RBAC & PostGIS",
    color: "#D9C7AC",
    description:
      "Enterprise data protection with Row-Level Security, parameterized PostGIS geospatial queries, and bcrypt password hashing.",
  },
];

export default function TravelSafetySection() {
  return (
    <section
      id="travel-safety"
      style={{
        background: "#0d1114",
        color: "var(--text)",
        padding: "clamp(80px, 10vw, 144px) clamp(20px, 3.4vw, 52px)",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 64 }}>
        {/* Section header */}
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid rgba(220,38,38,0.3)",
              background: "rgba(220,38,38,0.1)",
              color: "var(--danger)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              alignSelf: "center",
            }}
          >
            <Shield style={{ width: 13, height: 13 }} />
            <span>Intelligent Safety Architecture</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "var(--text)",
            }}
          >
            Explore Freely.{" "}
            <span style={{ fontStyle: "italic", color: "#E76F51", fontWeight: 300 }}>
              Travel Confidently.
            </span>
          </h2>

          <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 300, lineHeight: 1.65 }}>
            Exploration and personal safety belong together. WanderLens protects independent and
            group travelers through a sophisticated telemetry net that never intrudes until you
            need it.
          </p>
        </div>

        {/* Safety pillars grid — Framer Motion whileInView unchanged */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 20,
          }}
        >
          {SAFETY_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  background: "var(--panel)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "border-color 0.25s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(185,154,101,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line)";
                }}
              >
                <div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      background: `${pillar.color}20`,
                      color: pillar.color,
                    }}
                  >
                    <Icon style={{ width: 22, height: 22 }} />
                  </div>
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 500,
                      color: "var(--text)",
                      marginBottom: 8,
                    }}
                  >
                    {pillar.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, fontWeight: 300 }}>
                    {pillar.description}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 12,
                    borderTop: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--muted)",
                  }}
                >
                  <span>Pillar 0{idx + 1}</span>
                  <span style={{ color: "#34d399" }}>Active Node</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Emergency command banner */}
        <div
          style={{
            padding: "32px",
            borderRadius: 16,
            background: "var(--panel)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(220,38,38,0.3)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(220,38,38,0.15)",
                border: "1px solid rgba(220,38,38,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--danger)",
                flexShrink: 0,
              }}
              className="animate-pulse"
            >
              <AlertOctagon style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>
                Emergency SOS Dispatch Net
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Rate-limited to 3 triggers per hour to prevent accidental misuse. Protected by
                database audit logs.
              </div>
            </div>
          </div>

          <Link
            href="/sos"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              borderRadius: 999,
              background: "#E76F51",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textDecoration: "none",
              transition: "background 0.25s, transform 0.25s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#d65f42";
              el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#E76F51";
              el.style.transform = "";
            }}
          >
            <span>Test SOS Safety Mode</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
