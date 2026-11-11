"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(96px, 14vw, 176px) clamp(20px, 3.4vw, 52px)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {/* Background image */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1920&q=80&auto=format&fit=crop"
          alt="Ancient Palace at Dusk"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.4) contrast(1.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, var(--ink) 0%, rgba(11,16,19,0.7) 50%, var(--ink) 100%)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 720,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 999,
            border: "1px solid rgba(185,154,101,0.4)",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
            color: "var(--muted)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <span style={{ color: "#B99A65" }}>✦</span>
          <span>Begin Your Heritage Chapter</span>
        </div>

        <h2
          style={{
            fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
            fontWeight: 400,
            lineHeight: 1.1,
            color: "var(--text)",
          }}
        >
          Every Journey{" "}
          <span style={{ fontStyle: "italic", color: "#B99A65", fontWeight: 300 }}>
            Has a Story.
          </span>
        </h2>

        <p
          style={{
            fontSize: 16,
            color: "var(--muted)",
            fontWeight: 300,
            lineHeight: 1.65,
            maxWidth: 520,
          }}
        >
          Discover the places that shaped history. Create memories along the way. And travel with
          the confidence of intelligent telemetry.
        </p>

        <div style={{ paddingTop: 8 }}>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 40px",
              borderRadius: 999,
              background: "#B99A65",
              color: "#0b1013",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "background 0.25s, transform 0.25s",
              boxShadow: "0 8px 30px rgba(185,154,101,0.4)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#caa974";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#B99A65";
              el.style.transform = "";
            }}
          >
            <span>Start Your Journey</span>
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </section>
  );
}
