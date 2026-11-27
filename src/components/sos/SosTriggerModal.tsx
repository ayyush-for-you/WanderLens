"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface SosTriggerModalProps {
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
}

export default function SosTriggerModal({ coords, onClose }: SosTriggerModalProps) {
  const [message, setMessage]           = useState("");
  const [progress, setProgress]         = useState(0);
  const [sent, setSent]                 = useState(false);
  const [loading, setLoading]           = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const HOLD_MS = 1000; // 1 second hold-to-confirm (PRD §3 Screen 7)

  // Detect if coords are null because permission was denied vs simply loading
  // We surface a denied state if the browser exposes it (best-effort).
  // The parent component is expected to pass null for both "loading" and
  // "denied". We rely on the message to distinguish.
  // (If you want precise denial detection, wire it up in the parent and pass
  //  a prop; this component handles whatever null means gracefully.)

  const startHold = useCallback(() => {
    if (!coords || loading || sent) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, coords, loading, sent]);

  const cancelHold = useCallback(() => {
    if (holdInterval.current) clearInterval(holdInterval.current);
    setProgress(0);
  }, []);

  const handleSend = async () => {
    if (loading || sent) return;
    // Safety guard: never send 0,0 as coordinates
    if (!coords) {
      toast.error("Cannot send SOS without a valid location.");
      setProgress(0);
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        latitude: coords.lat,
        longitude: coords.lng,
      };
      const trimmedNote = message.trim().slice(0, 200);
      if (trimmedNote) body.note = trimmedNote;

      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send SOS");
        setLoading(false);
        setProgress(0);
        return;
      }
      // Capture the recipient count from the API response (data.alert.recipient_count)
      const count =
        typeof data?.alert?.recipient_count === "number"
          ? data.alert.recipient_count
          : null;
      setRecipientCount(count);
      setSent(true);
      toast.success("SOS sent successfully.");
      setTimeout(onClose, 3000);
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
      setProgress(0);
    }
  };

  const circumference = 2 * Math.PI * 34; // r=34

  // Determine what to show for the location status
  const noCoords = !coords;

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

        {/* Location status */}
        {coords ? (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", marginBottom: 16, fontSize: "0.85rem" }}>
            📍 {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
          </div>
        ) : (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", marginBottom: 16, fontSize: "0.85rem", color: "#fbbf24" }}>
            {locationDenied
              ? "⛔ Location access was denied. Please enable it in your browser settings and reopen this modal."
              : "⏳ Waiting for your location…"}
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
              maxLength={200}
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
            <svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              style={{ margin: "0 auto 12px", display: "block", pointerEvents: "none" }}
            >
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
            {recipientCount === null || recipientCount > 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 6 }}>
                {recipientCount !== null
                  ? `${recipientCount} nearby helper${recipientCount === 1 ? "" : "s"} notified.`
                  : "Nearby travellers have been notified."}
              </p>
            ) : (
              <p style={{ color: "#fbbf24", fontSize: "0.8rem", marginTop: 6 }}>
                No nearby opted-in helpers right now.
              </p>
            )}
          </motion.div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>

            {/* Hold-to-confirm button with circular progress ring */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* SVG ring — pointer-events:none so it never intercepts clicks */}
              <svg
                width="80"
                height="80"
                style={{ position: "absolute", transform: "rotate(-90deg)", pointerEvents: "none" }}
              >
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

              {noCoords ? (
                /* Disabled state when location is not yet available */
                <button
                  className="btn btn-danger"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    padding: 0,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    flexDirection: "column",
                    gap: 2,
                    opacity: 0.5,
                    cursor: "not-allowed",
                    position: "relative",
                    zIndex: 1,
                    touchAction: "none",
                    userSelect: "none",
                  }}
                  disabled
                  title="Waiting for your location…"
                >
                  🆘
                  <span style={{ fontSize: "0.55rem" }}>WAIT…</span>
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    padding: 0,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    flexDirection: "column",
                    gap: 2,
                    // Sit above the absolutely-positioned SVG ring
                    position: "relative",
                    zIndex: 1,
                    // Prevent text selection and browser touch callout while holding
                    touchAction: "none",
                    userSelect: "none",
                  }}
                  // Pointer events work for both mouse and touch
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    startHold();
                  }}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                  disabled={loading}
                >
                  🆘
                  <span style={{ fontSize: "0.6rem" }}>HOLD</span>
                </button>
              )}
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
