"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Camera } from "lucide-react";

// ── Data unchanged ──────────────────────────────────────────────────────────
const HERITAGE_DESTINATIONS = [
  {
    id: 1,
    title: "Taj Mahal",
    location: "Agra, Uttar Pradesh",
    era: "Mughal Golden Age (1631 AD)",
    description:
      "An ivory-white marble mausoleum on the south bank of the Yamuna River, renowned for its flawless symmetry and Pietra Dura floral inlay.",
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000&q=80&auto=format&fit=crop",
    tag: "taj_mahal",
  },
  {
    id: 2,
    title: "Hawa Mahal",
    location: "Jaipur, Rajasthan",
    era: "Rajput Era (1799 AD)",
    description:
      "The Palace of Winds features 953 honeycombed jharokhas built of pink and red sandstone to let royal ladies observe bazaar festivities unseen.",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1000&q=80&auto=format&fit=crop",
    tag: "hawa_mahal",
  },
  {
    id: 3,
    title: "Qutub Minar",
    location: "New Delhi, Delhi",
    era: "Delhi Sultanate (1192 AD)",
    description:
      "A 72.5-metre victory minaret built with fluted red sandstone storeys and Quranic calligraphy, standing inside an ancient complex.",
    image:
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=1000&q=80&auto=format&fit=crop",
    tag: "qutub_minar",
  },
  {
    id: 4,
    title: "Red Fort",
    location: "Old Delhi, Delhi",
    era: "Mughal Imperial Seat (1638 AD)",
    description:
      "The historic fortified palace of Shahjahanabad, boasting the iconic Lahore Gate where India's sovereign flag is hoisted every Independence Day.",
    image:
      "https://images.unsplash.com/photo-1592635196078-9ffc8f654b9d?w=1000&q=80&auto=format&fit=crop",
    tag: "red_fort",
  },
  {
    id: 5,
    title: "Amer Fort & Palace",
    location: "Amer, Jaipur",
    era: "Rajput-Mughal Fusion (1592 AD)",
    description:
      "Perched high on Cheel ka Teela, overlooking Maota Lake, famed for the Sheesh Mahal mirror palace and ornate carved gateways.",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1000&q=80&auto=format&fit=crop",
    tag: "amer_fort",
  },
  {
    id: 6,
    title: "Konark Sun Temple",
    location: "Konark, Odisha",
    era: "Eastern Ganga Dynasty (1250 AD)",
    description:
      "Conceived as a colossal stone chariot of the Sun God Surya with 24 elaborately carved stone wheels drawn by seven horses.",
    image:
      "https://images.unsplash.com/photo-1600100397608-f010f443b740?w=1000&q=80&auto=format&fit=crop",
    tag: "konark",
  },
];

// ── Component ───────────────────────────────────────────────────────────────
export default function HeritageDiscoverySection() {
  // State unchanged — logic preserved exactly
  const [activeDestination, setActiveDestination] = useState(HERITAGE_DESTINATIONS[0]);

  return (
    <section
      id="heritage-discovery"
      style={{
        background: "var(--ink)",
        color: "var(--text)",
        padding: "clamp(80px, 10vw, 144px) clamp(20px, 3.4vw, 52px)",
        position: "relative",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: 64,
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
                Curated Heritage Catalogue
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
              History Is Waiting{" "}
              <span style={{ fontStyle: "italic", color: "#B99A65", fontWeight: 300 }}>
                to Be Discovered.
              </span>
            </h2>
          </div>

          <Link
            href="/scan"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              height: 40,
              padding: "0 20px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              color: "var(--soft)",
              fontSize: 13,
              textDecoration: "none",
              transition: "border-color 0.25s, color 0.25s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "#B99A65";
              el.style.color = "#B99A65";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "var(--line)";
              el.style.color = "var(--soft)";
            }}
          >
            <Camera style={{ width: 14, height: 14, color: "#B99A65" }} />
            <span>Launch Monument Scanner</span>
          </Link>
        </div>

        {/* Magazine grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
            gap: 32,
            alignItems: "start",
          }}
        >
          {/* Main showcase */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                aspectRatio: "16/10",
                border: "1px solid var(--line)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeDestination.image}
                alt={activeDestination.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.7s ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, var(--ink) 0%, transparent 50%)",
                }}
              />

              {/* Era badge */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(10px)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--muted)",
                  border: "1px solid var(--line)",
                }}
              >
                {activeDestination.era}
              </div>

              {/* Bottom info + CTA */}
              <div
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: 24,
                  right: 24,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "clamp(1.25rem, 3vw, 2rem)",
                      fontWeight: 400,
                      color: "var(--text)",
                    }}
                  >
                    {activeDestination.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 4,
                    }}
                  >
                    <MapPin style={{ width: 12, height: 12, color: "#B99A65" }} />
                    <span>{activeDestination.location}</span>
                  </div>
                </div>

                <Link
                  href="/scan"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#B99A65",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.25s, transform 0.25s",
                  }}
                  title="Scan & Reveal History"
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "#caa974";
                    el.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "#B99A65";
                    el.style.transform = "";
                  }}
                >
                  <ArrowRight style={{ width: 16, height: 16, color: "#0b1013" }} />
                </Link>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, paddingLeft: 4 }}>
              {activeDestination.description}
            </p>
          </div>

          {/* Destination roster — onClick handler preserved */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#B99A65",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Select Destination:
            </div>

            {HERITAGE_DESTINATIONS.map((dest) => {
              const isSelected = dest.id === activeDestination.id;
              return (
                <div
                  key={dest.id}
                  onClick={() => setActiveDestination(dest)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${isSelected ? "#B99A65" : "var(--line)"}`,
                    background: isSelected ? "rgba(185,154,101,0.12)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.25s, border-color 0.25s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLDivElement).style.background = "var(--hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid var(--line)",
                        flexShrink: 0,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dest.image}
                        alt={dest.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isSelected ? "#B99A65" : "var(--text)",
                          transition: "color 0.25s",
                        }}
                      >
                        {dest.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{dest.location}</div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#B99A65",
                      opacity: isSelected ? 1 : 0,
                      transition: "opacity 0.25s",
                    }}
                  >
                    View →
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
