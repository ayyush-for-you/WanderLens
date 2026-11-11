"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Radio, Bell, ArrowRight } from "lucide-react";

export default function GroupExperienceSection() {
  return (
    <section
      id="group-experience"
      style={{
        background: "var(--ink)",
        color: "var(--text)",
        padding: "clamp(80px, 10vw, 144px) clamp(20px, 3.4vw, 52px)",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
            gap: "clamp(48px, 6vw, 80px)",
            alignItems: "center",
          }}
        >
          {/* Left: Editorial copy */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 24, order: 2 }}
            className="group-copy-col"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                Group Travel Mode
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
              Together Is a Better{" "}
              <span style={{ fontStyle: "italic", color: "#00C9A7", fontWeight: 300 }}>
                Way to Explore.
              </span>
            </h2>

            <p style={{ fontSize: 17, color: "var(--soft)", fontWeight: 300, lineHeight: 1.65 }}>
              Travel together, stay connected and experience every destination without losing sight
              of your group.
            </p>

            <ul style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
              {[
                {
                  Icon: Users,
                  text: "Real-time multi-user location synchronization with low-latency Supabase channels.",
                },
                {
                  Icon: Radio,
                  text: "Active member roster with instant online/offline indicators and status badges.",
                },
                {
                  Icon: Bell,
                  text: "One-touch broadcast alerts to the entire group or private member pings.",
                },
              ].map(({ Icon, text }) => (
                <li
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 14,
                    color: "var(--soft)",
                  }}
                >
                  <Icon style={{ width: 15, height: 15, color: "#00C9A7", flexShrink: 0 }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div style={{ paddingTop: 8 }}>
              <Link
                href="/groups"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 32px",
                  borderRadius: 999,
                  background: "#B99A65",
                  color: "#0b1013",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
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
                <span>Explore Group Mode</span>
                <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
            </div>
          </div>

          {/* Right: Shared map preview — all Framer Motion animations unchanged */}
          <div style={{ position: "relative", order: 1 }} className="group-map-col">
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid var(--line)",
                aspectRatio: "4/3",
                position: "relative",
                background: "#0E1522",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* Simulated Map Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid var(--line)",
                    fontSize: 11,
                    color: "#00C9A7",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#34d399",
                      display: "inline-block",
                    }}
                    className="animate-pulse"
                  />
                  <span>3 Members Synchronized · Delhi Heritage Corridor</span>
                </div>
              </div>

              {/* Animated map markers — Framer Motion animations preserved exactly */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "auto 0",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.2,
                    backgroundImage: "radial-gradient(#B99A65 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />

                {/* Member 1: Alice */}
                <motion.div
                  animate={{ x: [0, 40, 10, 0], y: [0, -20, 15, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: "25%",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#6C63FF",
                      border: "2px solid #fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    A
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.8)",
                      background: "rgba(0,0,0,0.6)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Alice
                  </span>
                </motion.div>

                {/* Member 2: Bob */}
                <motion.div
                  animate={{ x: [0, -30, 20, 0], y: [0, 25, -10, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  style={{
                    position: "absolute",
                    bottom: "30%",
                    right: "20%",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#00C9A7",
                      border: "2px solid #fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    B
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.8)",
                      background: "rgba(0,0,0,0.6)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Bob
                  </span>
                </motion.div>

                {/* Member 3: You */}
                <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="pulse-user-pin" />
                  <span
                    style={{
                      fontSize: 10,
                      color: "#B99A65",
                      background: "rgba(0,0,0,0.7)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontWeight: 700,
                      border: "1px solid rgba(185,154,101,0.4)",
                    }}
                  >
                    You
                  </span>
                </div>
              </div>

              {/* Bottom telemetry bar */}
              <div
                style={{
                  zIndex: 10,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "var(--muted)",
                }}
              >
                <span>Broadcast Channel: trek-crew-delhi</span>
                <span style={{ color: "#34d399" }}>Latency &lt; 200ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .group-copy-col { order: 1 !important; }
          .group-map-col  { order: 2 !important; }
        }
      `}</style>
    </section>
  );
}
