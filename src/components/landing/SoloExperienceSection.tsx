"use client";

import React from "react";
import Link from "next/link";
import { Compass, ShieldAlert, Bookmark, Radio, ArrowRight } from "lucide-react";

export default function SoloExperienceSection() {
  return (
    <section
      id="solo-experience"
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
          {/* Left: Imagery */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid var(--line)",
                aspectRatio: "4/3",
                position: "relative",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80&auto=format&fit=crop"
                alt="Solo Traveler Orienting with Map"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 50%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "#B99A65",
                  }}
                >
                  Private Exploration Stream
                </span>
                <div style={{ fontSize: 20, fontWeight: 500, color: "var(--text)" }}>
                  Independent Contemplation
                </div>
              </div>
            </div>

            {/* Floating feature card */}
            <div
              style={{
                position: "absolute",
                bottom: -24,
                right: -16,
                background: "var(--panel)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: 20,
                maxWidth: 240,
                boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
              }}
              className="solo-float-card"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#00C9A7",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                <Radio style={{ width: 13, height: 13 }} className="animate-pulse" />
                <span>Zero Location Leaks</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                Your coordinates remain completely private on your device unless you trigger the
                emergency SOS.
              </p>
            </div>
          </div>

          {/* Right: Editorial copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
                Solo Travel Mode
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
              Your Journey.{" "}
              <span style={{ fontStyle: "italic", color: "#B99A65", fontWeight: 300 }}>
                Your Own Way.
              </span>
            </h2>

            <p style={{ fontSize: 17, color: "var(--soft)", fontWeight: 300, lineHeight: 1.65 }}>
              Explore at your own pace. Discover hidden places, understand their history, save your
              favorite destinations and stay protected wherever you go.
            </p>

            <ul style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
              {[
                {
                  Icon: Compass,
                  text: "Orient yourself with high-contrast Google and CartoDB DarkMatter maps.",
                },
                {
                  Icon: Bookmark,
                  text: "Save iconic ruins and hidden gems to your personal travel journal.",
                },
                {
                  Icon: ShieldAlert,
                  text: "1-second press-and-hold Emergency SOS distress trigger with audit logging.",
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
                  <Icon style={{ width: 15, height: 15, color: "#B99A65", flexShrink: 0 }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div style={{ paddingTop: 8 }}>
              <Link
                href="/solo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 32px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid var(--line)",
                  color: "var(--text)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "background 0.25s, border-color 0.25s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "var(--hover)";
                  el.style.borderColor = "#B99A65";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "rgba(255,255,255,0.08)";
                  el.style.borderColor = "var(--line)";
                }}
              >
                <span>Explore Solo Mode</span>
                <ArrowRight style={{ width: 15, height: 15, color: "#B99A65" }} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) { .solo-float-card { display: none !important; } }
      `}</style>
    </section>
  );
}
