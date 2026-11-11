"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";

// ── Data unchanged ──────────────────────────────────────────────────────────
const HISTORICAL_STORIES = [
  {
    era: "1648 AD · Mughal Empire",
    title: "The Mirror Palaces of Shah Jahan",
    monument: "Red Fort & Amer Palace",
    narrative:
      "In the twilight of the Mughal architectural renaissance, Master artisans embedded thousands of Belgian convex mirrors into stucco ceilings so that a single oil lamp would illuminate the entire chamber like a galaxy of stars.",
    quote:
      "\u201cIf there be a paradise on earth, it is this, it is this, it is this.\u201d \u2014 Diwan-i-Khas Inscription",
    image:
      "https://images.unsplash.com/photo-1592635196078-9ffc8f654b9d?w=1000&q=80&auto=format&fit=crop",
  },
  {
    era: "1799 AD · Rajput Royalty",
    title: "A Crown of Winds for Royal Ladies",
    monument: "Hawa Mahal, Jaipur",
    narrative:
      "Without a traditional foundation, Lal Chand Ustad erected a soaring 50-foot screen wall resembling Lord Krishna\u2019s crown, pierced by 953 stone-latticed jharokhas that channeled cool desert breezes through the Venturi effect.",
    quote:
      "\u201cCrafted so the women of the court could witness everyday processions unseen by the gaze of the street.\u201d",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1000&q=80&auto=format&fit=crop",
  },
  {
    era: "1192 AD · Delhi Sultanate",
    title: "The Unyielding Victory Minaret",
    monument: "Qutub Minar Complex",
    narrative:
      "Standing at 72.5 metres, Qutub Minar defied multiple earthquakes and lightning strikes over eight centuries. Each dynasty repaired its fluted columns using distinctive stones \u2014 red sandstone, followed by white marble.",
    quote:
      "\u201cThe highest brick victory minaret in the world, etched with Quranic verses and nagari inscriptions.\u201d",
    image:
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=1000&q=80&auto=format&fit=crop",
  },
];

export default function StorytellingSection() {
  // State and handlers unchanged
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const activeStory = HISTORICAL_STORIES[activeStoryIdx];

  return (
    <section
      id="historical-storytelling"
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
        style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 64 }}
      >
        {/* Section header */}
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
                Historical Storytelling
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
              Every Stone{" "}
              <span style={{ fontStyle: "italic", color: "#B99A65", fontWeight: 300 }}>
                Has a Story.
              </span>
            </h2>
          </div>

          {/* Era navigation pills — onClick handler unchanged */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {HISTORICAL_STORIES.map((s, idx) => (
              <button
                key={s.era}
                onClick={() => setActiveStoryIdx(idx)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.25s, color 0.25s",
                  background:
                    idx === activeStoryIdx ? "rgba(255,255,255,0.1)" : "transparent",
                  color: idx === activeStoryIdx ? "var(--text)" : "var(--muted)",
                  border: `1px solid ${idx === activeStoryIdx ? "var(--line)" : "transparent"}`,
                }}
              >
                Story 0{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Editorial story spread — AnimatePresence unchanged */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStory.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
              gap: "clamp(32px, 5vw, 60px)",
              alignItems: "center",
            }}
          >
            {/* Story image */}
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                aspectRatio: "16/10",
                border: "1px solid var(--line)",
                position: "relative",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeStory.image}
                alt={activeStory.title}
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
                  right: 24,
                  fontSize: 13,
                  fontStyle: "italic",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {activeStory.quote}
              </div>
            </div>

            {/* Story text */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "#B99A65",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                <Calendar style={{ width: 13, height: 13 }} />
                <span>{activeStory.era}</span>
              </div>

              <h3
                style={{
                  fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: "var(--text)",
                }}
              >
                {activeStory.title}
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#B99A65",
                }}
              >
                <MapPin style={{ width: 13, height: 13 }} />
                <span>{activeStory.monument}</span>
              </div>

              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, fontWeight: 300 }}>
                {activeStory.narrative}
              </p>

              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "var(--hover)",
                  border: "1px solid var(--line)",
                  fontSize: 13,
                  color: "var(--muted)",
                  fontStyle: "italic",
                }}
              >
                Uncovered and verified by Archaeological Survey records on WanderLens.
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
