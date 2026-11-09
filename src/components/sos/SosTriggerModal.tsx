"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Phone } from "lucide-react";
import toast from "react-hot-toast";

interface SosTriggerModalProps {
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
}

export default function SosTriggerModal({ coords, onClose }: SosTriggerModalProps) {
  const [message, setMessage]       = useState("");
  const [progress, setProgress]     = useState(0);
  const [sent, setSent]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const HOLD_MS = 1000; // 1 second hold-to-confirm (PRD §3 Screen 7)

  const startHold = useCallback(() => {
    holdInterval.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 100 / (HOLD_MS / 50);
        if (next >= 100) {
          clearInterval(holdInterval.current!);
          handleSend();
          return 100;
        }
        return next;
      });
    }, 50);
  }, [message, coords]);

  const cancelHold = useCallback(() => {
    if (holdInterval.current) clearInterval(holdInterval.current);
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    setProgress(0);
  }, []);

  const handleSend = async () => {
    if (loading || sent) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coords?.lat ?? 0,
          lng: coords?.lng ?? 0,
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send SOS");
        setLoading(false);
        setProgress(0);
        return;
      }
      setSent(true);
      toast.success("SOS sent successfully.");
      setTimeout(onClose, 2000);
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
      setProgress(0);
    }
  };

  const circumference = 2 * Math.PI * 34; // r=34

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-card modal-card-danger"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25 }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.5rem" }}>🆘</span>
            <h2 className="font-heading" style={{ fontSize: "1.2rem" }}>EMERGENCY SOS</h2>
          </div>
          {!sent && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Location */}
        {coords ? (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", marginBottom: 16, fontSize: "0.85rem" }}>
            📍 {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
          </div>
        ) : (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", marginBottom: 16, fontSize: "0.85rem", color: "#fbbf24" }}>
            ⚠ Location unavailable — SOS will be sent without coordinates
          </div>
        )}

        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16, lineHeight: 1.6 }}>
          Your location will be sent to nearby WanderLens users within 2 km.
        </p>

        {/* Optional message */}
        {!sent && (
          <div style={{ marginBottom: 16 }}>
            <label className="label">Message (optional)</label>
            <input
              className="input"
              placeholder="e.g. I need help near the main gate"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={120}
            />
          </div>
        )}

        {/* Rate limit notice */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: "0.8rem", color: "#fbbf24" }}>
          <AlertTriangle size={13} />
          <span>Rate limit: 3 SOS per hour</span>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", padding: "16px 0" }}
          >
            {/* Checkmark SVG */}
            <svg width="60" height="60" viewBox="0 0 60 60" style={{ margin: "0 auto 12px", display: "block" }}>
              <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(0,201,167,0.3)" strokeWidth="2" />
              <motion.path
                d="M18 30 L26 38 L42 22"
                fill="none"
                stroke="#00C9A7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              />
            </svg>
            <p style={{ color: "#00C9A7", fontWeight: 600 }}>SOS sent successfully!</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 6 }}>Nearby travellers have been notified.</p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>

            {/* Hold-to-confirm button with circular progress ring */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="80" height="80" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,107,107,0.2)" strokeWidth="4" />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#FF6B6B"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                />
              </svg>
              <button
                className="btn btn-danger"
                style={{ width: 60, height: 60, borderRadius: "50%", padding: 0, fontSize: "0.75rem", fontWeight: 700, flexDirection: "column", gap: 2 }}
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                disabled={loading}
              >
                🆘
                <span style={{ fontSize: "0.6rem" }}>HOLD</span>
              </button>
            </div>
          </div>
        )}

        {/* Emergency disclaimer */}
        <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 8, background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", fontSize: "0.75rem", color: "#fca5a5", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>This alerts nearby app users only. It does not contact emergency services.</strong>
            {" "}In a life-threatening emergency, call{" "}
            <a href="tel:112" style={{ color: "#FF6B6B", fontWeight: 600 }}>112</a>.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

