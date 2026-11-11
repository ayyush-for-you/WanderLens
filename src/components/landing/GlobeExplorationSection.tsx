"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

// ── Data unchanged ──────────────────────────────────────────────────────────
const HERITAGE_NODES = [
  {
    name: "Jaipur Circuit",
    state: "Rajasthan",
    lat: "26.92° N",
    lng: "75.82° E",
    sites: "Hawa Mahal, Amer Fort, Jantar Mantar",
    x: 44,
    y: 42,
  },
  {
    name: "Delhi Imperial Center",
    state: "Delhi NCR",
    lat: "28.61° N",
    lng: "77.20° E",
    sites: "Qutub Minar, Red Fort, Humayun's Tomb",
    x: 48,
    y: 36,
  },
  {
    name: "Agra Mughal Heart",
    state: "Uttar Pradesh",
    lat: "27.17° N",
    lng: "78.04° E",
    sites: "Taj Mahal, Agra Fort, Fatehpur Sikri",
    x: 52,
    y: 40,
  },
  {
    name: "Konark Coastal Temple",
    state: "Odisha",
    lat: "19.88° N",
    lng: "86.09° E",
    sites: "Sun Temple Chariot Wheels",
    x: 64,
    y: 56,
  },
];

export default function GlobeExplorationSection() {
  // State and onClick handler unchanged
  const [activeNode, setActiveNode] = useState(HERITAGE_NODES[0]);

  return (
    <section
      style={{
        background: "var(--ink)",
        color: "var(--text)",
        padding: "clamp(80px, 10vw, 144px) clamp(20px, 3.4vw, 52px)",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div
        style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}
      >
        {/* Section header */}
        <div
          style={{
            textAlign: "center",
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid rgba(185,154,101,0.3)",
              background: "rgba(185,154,101,0.08)",
              color: "#B99A65",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              alignSelf: "center",
            }}
          >
            <Globe style={{ width: 13, height: 13 }} />
            <span>Interactive Heritage Sphere</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "var(--text)",
            }}
          >
            Constellations of{" "}
            <span style={{ fontStyle: "italic", color: "#B99A65", fontWeight: 300 }}>
              Indian Heritage.
            </span>
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 300, lineHeight: 1.65 }}>
            Click on any archaeological circuit node across the Indian subcontinent to inspect its
            telemetry and monumental wonders.
          </p>
        </div>

        {/* Globe canvas */}
        <div
          style={{
            position: "relative",
            maxWidth: 896,
            margin: "0 auto",
            aspectRatio: "16/9",
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--panel)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--line)",
            padding: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
            width: "100%",
          }}
        >
          {/* Concentric orbital rings — animation unchanged */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 500,
                height: 500,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.05)",
                animation: "spin 35s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 340,
                height: 340,
                borderRadius: "50%",
                border: "1px solid rgba(185,154,101,0.1)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: "1px solid rgba(185,154,101,0.15)",
              }}
            />
          </div>

          {/* Nodes — onClick handler unchanged */}
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {HERITAGE_NODES.map((node) => {
              const isSelected = node.name === activeNode.name;
              return (
                <div
                  key={node.name}
                  onClick={() => setActiveNode(node)}
                  style={{
                    position: "absolute",
                    top: `${node.y}%`,
                    left: `${node.x}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: isSelected ? "#B99A65" : "rgba(255,255,255,0.4)",
                          transform: isSelected ? "scale(1.25)" : "scale(1)",
                          transition: "all 0.25s",
                          display: "block",
                        }}
                      />
                      {isSelected && (
                        <span
                          style={{
                            position: "absolute",
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            border: "1px solid #B99A65",
                            animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        display: "block",
                        marginTop: 6,
                        whiteSpace: "nowrap",
                        color: isSelected ? "#B99A65" : "rgba(255,255,255,0.6)",
                        fontWeight: isSelected ? 700 : 400,
                        transition: "color 0.25s",
                      }}
                    >
                      {node.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active node detail — motion animation unchanged */}
          <motion.div
            key={activeNode.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: "absolute",
              bottom: 24,
              left: 24,
              right: 24,
              maxWidth: 340,
              background: "var(--panel)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(185,154,101,0.4)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#B99A65",
                marginBottom: 4,
              }}
            >
              <span>{activeNode.state}</span>
              <span>
                {activeNode.lat}, {activeNode.lng}
              </span>
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>
              {activeNode.name}
            </h4>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>{activeNode.sites}</p>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
