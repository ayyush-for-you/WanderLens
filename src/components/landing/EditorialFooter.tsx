"use client";

import React from "react";
import { ArrowUp } from "lucide-react";

export default function EditorialFooter() {
  // scrollToTop handler unchanged
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      style={{
        background: "var(--ink)",
        color: "var(--text)",
        borderTop: "1px solid var(--line)",
        padding: "clamp(60px, 8vw, 96px) clamp(20px, 3.4vw, 52px) 48px",
        position: "relative",
      }}
    >
      <div
        style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 56 }}
      >
        {/* Brand + back-to-top */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            paddingBottom: 40,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              {/* Logo mark */}
              <svg width="24" height="22" viewBox="0 0 30 26" fill="white" fillRule="evenodd" aria-hidden="true">
                <path d="M3.2 19.6C.4 15.8 1.3 8.6 6.6 4.7 11.3 1.2 18.9.9 23.9 4.1c4.7 3 6.3 9 3.6 13.9-2.9 5.3-9.4 7.7-15.4 7-3.8-.4-6.9-2.4-8.9-5.4ZM9.5 17.2l4.3-6.4 2.6 3.6 1.7-2.2 3.4 5z" />
              </svg>
              <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text)" }}>
                Wander<span style={{ color: "#B99A65" }}>Lens</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 360, lineHeight: 1.6, fontWeight: 300 }}>
              A luxury travel and heritage discovery platform combining AI vision, archival
              storytelling, and real-time cloud travel telemetry.
            </p>
          </div>

          <button
            onClick={scrollToTop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#B99A65",
              cursor: "pointer",
              transition: "color 0.25s",
              background: "none",
              border: "none",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#B99A65")}
          >
            <span>Back to Top</span>
            <ArrowUp style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* 4-column directory */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 32,
            fontSize: 13,
          }}
        >
          {/* Navigation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#B99A65",
                marginBottom: 4,
              }}
            >
              Platform Navigation
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8, color: "var(--muted)", listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { href: "#brand-story", label: "Our Philosophy" },
                { href: "#heritage-discovery", label: "Heritage Discovery" },
                { href: "#interactive-map", label: "Interactive Map" },
                { href: "#solo-experience", label: "Solo Travel Mode" },
                { href: "#group-experience", label: "Group Travel Mode" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)")}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured Monuments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#B99A65",
                marginBottom: 4,
              }}
            >
              Featured Monuments
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8, color: "var(--muted)", listStyle: "none", padding: 0, margin: 0 }}>
              {["Hawa Mahal, Jaipur", "Taj Mahal, Agra", "Qutub Minar, New Delhi", "Red Fort, Old Delhi", "Amer Fort & Palace", "Konark Sun Temple"].map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>

          {/* Safety */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#B99A65",
                marginBottom: 4,
              }}
            >
              Safety & Architecture
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8, color: "var(--muted)", listStyle: "none", padding: 0, margin: 0 }}>
              {["Emergency SOS Dispatch (2km Radius)", "Encrypted WebSocket Sharing", "PostgreSQL Audit Log Ledger", "PostGIS Proximity Search", "FastAPI CLIP Recognition AI", "Row-Level Security (RLS)"].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#B99A65",
                marginBottom: 4,
              }}
            >
              Platform Status
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, fontWeight: 300 }}>
              Designed for travelers worldwide. Fully responsive, secure, and compliant with
              privacy standards.
            </p>
            <div style={{ fontSize: 12, color: "#B99A65" }}>Status: All Cloud Services Active ●</div>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            paddingTop: 28,
            borderTop: "1px solid var(--line)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            fontSize: 11,
            color: "var(--muted)",
          }}
        >
          <div>© 2026 WanderLens. Designed for heritage exploration & safe travel.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {["Privacy Charter", "Security Terms", "AI Architecture"].map((t) => (
              <span
                key={t}
                style={{ cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLSpanElement).style.color = "var(--text)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLSpanElement).style.color = "var(--muted)")}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
