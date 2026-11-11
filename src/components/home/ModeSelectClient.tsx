"use client";

/**
 * ModeSelectClient — Phase 4 restyle.
 *
 * CONSTRAINTS (DESIGN_SPEC.md NON-NEGOTIABLE):
 *   - No logic changes. handleSelect, router.push, leaving state,
 *     AnimatePresence, and every Framer Motion prop are untouched.
 *   - No new features, no new animations.
 *   - Classes/markup only → design tokens: --ink, --panel, --line,
 *     --hover, --text, --soft, --muted, --ease. Radii 9–16px. Geist 400/500.
 */

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Compass, Users, ArrowRight } from "lucide-react";
import type { Profile } from "@/types/database";

interface ModeSelectClientProps {
  profile: Profile;
}

export default function ModeSelectClient({ profile }: ModeSelectClientProps) {
  // ── All logic unchanged ──────────────────────────────────────────────────
  const router = useRouter();
  const [leaving, setLeaving] = useState<"solo" | "group" | null>(null);

  const handleSelect = (mode: "solo" | "group") => {
    setLeaving(mode);
    setTimeout(() => {
      if (mode === "solo") router.push("/solo");
      else router.push("/groups");
    }, 350);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          // Framer Motion props unchanged
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35 }}
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px clamp(20px, 3.4vw, 52px) 48px",
            position: "relative",
            background: "var(--ink)",
            color: "var(--text)",
          }}
        >
          {/* Subtle radial glow behind cards */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(185,154,101,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <span
              style={{ width: 32, height: 1, background: "#B99A65", display: "block" }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.25em",
                color: "#B99A65",
                textTransform: "uppercase",
              }}
            >
              Tailored Travel Context
            </span>
          </div>

          {/* Title — motion props unchanged */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: "inherit",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 400,
              textAlign: "center",
              color: "var(--text)",
              marginBottom: 52,
              lineHeight: 1.25,
            }}
          >
            How do you wish to journey,{" "}
            <span style={{ fontStyle: "italic", color: "#B99A65", fontWeight: 300 }}>
              {profile.display_name.split(" ")[0]}
            </span>
            ?
          </motion.h1>

          {/* Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: 20,
              maxWidth: 720,
              width: "100%",
            }}
          >
            {/* ── Solo Mode Card — motion props unchanged ── */}
            <motion.div
              role="button"
              tabIndex={0}
              onClick={() => handleSelect("solo")}
              onKeyDown={(e) => e.key === "Enter" && handleSelect("solo")}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                background: "var(--panel)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "40px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                transition: "transform 0.35s var(--ease), border-color 0.35s, box-shadow 0.35s",
              }}
              whileHover={{
                translateY: -6,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#B99A65";
                el.style.boxShadow = "0 20px 60px rgba(185,154,101,0.18)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "var(--line)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  background: "rgba(185,154,101,0.12)",
                  border: "1px solid rgba(185,154,101,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#B99A65",
                  marginBottom: 24,
                  transition: "transform 0.3s var(--ease)",
                }}
              >
                <Compass style={{ width: 30, height: 30 }} />
              </div>

              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text)",
                  marginBottom: 12,
                }}
              >
                Solo Mode
              </h2>

              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  fontWeight: 300,
                  marginBottom: 28,
                }}
              >
                Explore freely at your own pace. Private location stream, high-resolution dark
                maps, and instant 2 km emergency SOS telemetry.
              </p>

              {/* CTA button — purely visual, handleSelect fires on the outer div */}
              <div
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 999,
                  background: "#B99A65",
                  color: "#0b1013",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: "auto",
                  pointerEvents: "none", // clicks bubble to the motion.div
                }}
              >
                <span>Enter Solo Sanctuary</span>
                <ArrowRight style={{ width: 15, height: 15 }} />
              </div>
            </motion.div>

            {/* ── Group Mode Card — motion props unchanged ── */}
            <motion.div
              role="button"
              tabIndex={0}
              onClick={() => handleSelect("group")}
              onKeyDown={(e) => e.key === "Enter" && handleSelect("group")}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                background: "var(--panel)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "40px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                transition: "transform 0.35s var(--ease), border-color 0.35s, box-shadow 0.35s",
              }}
              whileHover={{
                translateY: -6,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#00C9A7";
                el.style.boxShadow = "0 20px 60px rgba(0,201,167,0.18)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "var(--line)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  background: "rgba(0,201,167,0.12)",
                  border: "1px solid rgba(0,201,167,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00C9A7",
                  marginBottom: 24,
                }}
              >
                <Users style={{ width: 30, height: 30 }} />
              </div>

              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text)",
                  marginBottom: 12,
                }}
              >
                Group Mode
              </h2>

              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  fontWeight: 300,
                  marginBottom: 28,
                }}
              >
                Synchronized collective travel. Real-time multi-member location tracking, group
                broadcast alerts, and private party coordination.
              </p>

              {/* CTA button — purely visual */}
              <div
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid var(--line)",
                  color: "var(--soft)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: "auto",
                  pointerEvents: "none",
                  transition: "border-color 0.25s, color 0.25s",
                }}
              >
                <span>Enter Travel Party</span>
                <ArrowRight style={{ width: 15, height: 15 }} />
              </div>
            </motion.div>
          </div>

          {/* Footer note — motion props unchanged */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: 48,
              fontSize: 13,
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            Context can be switched fluidly anytime from the top navigation bar.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
