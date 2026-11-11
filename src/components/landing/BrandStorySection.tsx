"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function BrandStorySection() {
  return (
    <section
      id="brand-story"
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
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
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
            The Philosophy of Exploration
          </span>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
            gap: "clamp(48px, 6vw, 80px)",
            alignItems: "center",
          }}
        >
          {/* Left: Editorial copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <h2
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 400,
                lineHeight: 1.15,
                color: "var(--text)",
              }}
            >
              More Than Just{" "}
              <span
                style={{
                  fontStyle: "italic",
                  color: "#B99A65",
                  fontWeight: 300,
                  fontFamily: "inherit",
                }}
              >
                a Journey.
              </span>
            </h2>

            <p style={{ fontSize: 18, color: "var(--soft)", fontWeight: 300, lineHeight: 1.65 }}>
              Every monument has a story. Every journey creates a memory. WanderLens brings history,
              exploration and travel safety together in one connected, unforgettable experience.
            </p>

            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, fontWeight: 300 }}>
              We believe travel should feel like stepping into a living, breathing history book —
              where ruins regain their grandeur through AI-driven era reconstructions, and where
              every traveler moves with complete peace of mind, connected to their companions
              through state-of-the-art telemetry.
            </p>

            {/* Three pillars */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 24,
                paddingTop: 24,
                borderTop: "1px solid var(--line)",
              }}
            >
              {[
                {
                  num: "01",
                  title: "Heritage Discovery",
                  desc: "Instant visual monument recognition with era timelines and archival comparisons.",
                },
                {
                  num: "02",
                  title: "Dual Travel Modes",
                  desc: "Tailored solo contemplative exploration and live synchronized group coordination.",
                },
                {
                  num: "03",
                  title: "Cloud Travel Safety",
                  desc: "Hold-to-confirm emergency SOS, broadcast group alerts, and GPS peace of mind.",
                },
              ].map((p) => (
                <div key={p.num}>
                  <div
                    style={{ fontSize: 22, fontWeight: 700, color: "#B99A65", marginBottom: 4 }}
                  >
                    {p.num}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text)",
                      marginBottom: 4,
                    }}
                  >
                    {p.title}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Photography composition */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative", maxWidth: 400, margin: "0 auto" }}>
              {/* Primary image */}
              <div
                style={{
                  borderRadius: 24,
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  aspectRatio: "4/5",
                  position: "relative",
                  boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80&auto=format&fit=crop"
                  alt="Humayun Tomb Mughal Symmetry"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.7s ease",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.transform = "")
                  }
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 50%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    fontSize: 12,
                    fontStyle: "italic",
                    color: "var(--soft)",
                  }}
                >
                  Humayun's Tomb · Mughal Garden Symmetry
                </div>
              </div>

              {/* Floating stat card */}
              <div
                style={{
                  position: "absolute",
                  bottom: -32,
                  left: -32,
                  background: "var(--panel)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  padding: "20px",
                  maxWidth: 220,
                  display: "none", // shown via CSS below
                }}
                className="brand-stat-card"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#B99A65",
                    marginBottom: 6,
                  }}
                >
                  <Sparkles style={{ width: 14, height: 14 }} />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Curated Archive
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  950+ Historic Casements
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
                  Documented across 6 distinct architectural dynasties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .brand-stat-card { display: block !important; }
        }
      `}</style>
    </section>
  );
}
