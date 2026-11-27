"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertOctagon,
  ShieldAlert,
  PhoneCall,
  CheckCircle,
  AlertTriangle,
  Radio,
  Clock,
  RefreshCw,
  Navigation,
  Info,
} from "lucide-react";
import { SOS_RATE_LIMIT_PER_HOUR, SOS_RADIUS_METRES } from "@/config/constants";

interface IncomingAlert {
  id: string;
  sender_display_name: string;
  note: string | null;
  approx_distance_m: number;
  created_at: string;
  has_responded: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface MyActiveSos {
  id: string;
  note: string | null;
  recipient_count: number;
  created_at: string;
  status: "active" | "resolved" | "false_alarm";
  sos_responses?: Array<{
    helper_id: string;
    responded_at: string;
    profiles?: { id: string; display_name: string; avatar_url: string | null };
  }>;
}

type LocationState = "waiting" | "denied" | "ready";

/* ── design tokens ───────────────────────────────────────────────── */
const panelStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};

const pillBtn = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  border: "none",
  borderRadius: 999,
  padding: "9px 18px",
  fontSize: "0.84rem",
  fontWeight: 500,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
});

export default function SosClient() {
  const [optedIn, setOptedIn] = useState(false);
  const [isPresenceActive, setIsPresenceActive] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [myActiveSos, setMyActiveSos] = useState<MyActiveSos | null>(null);
  const [incomingAlerts, setIncomingAlerts] = useState<IncomingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingOptIn, setTogglingOptIn] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [sosNote, setSosNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [revealedCoords, setRevealedCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [locationState, setLocationState] = useState<LocationState>("waiting");

  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sos");
      const data = await res.json();
      if (res.ok) {
        setOptedIn(data.sos_opt_in);
        setIsPresenceActive(data.is_presence_active);
        setIsVerified(data.is_verified);
        setMyActiveSos(data.my_active_sos);
        setIncomingAlerts(data.incoming_alerts || []);
      }
    } catch (err) {
      console.error("Failed to fetch SOS status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    pollIntervalRef.current = setInterval(fetchStatus, 10_000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (!optedIn) {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      return;
    }

    const refreshPresence = () => {
      if (!("geolocation" in navigator)) {
        setLocationState("denied");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLocationState("ready");
          try {
            await fetch("/api/sos/presence", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                opt_in: true,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            });
          } catch (err) {
            console.error("Failed to refresh presence:", err);
          }
        },
        (err) => {
          console.warn("Presence GPS error:", err.message);
          setLocationState("denied");
        },
        { timeout: 8000, maximumAge: 10000 }
      );
    };

    refreshPresence();
    presenceIntervalRef.current = setInterval(refreshPresence, 5 * 60 * 1000);

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
    };
  }, [optedIn]);

  const eligibilityLine = (() => {
    if (!isVerified) return { ok: false, reason: "Account not verified — verify your email to receive alerts." };
    if (!optedIn) return { ok: false, reason: 'SOS opt-in is off — toggle "Opt In" above to receive alerts.' };
    if (locationState === "denied") return { ok: false, reason: "Location permission denied — allow location access to receive alerts." };
    if (locationState === "waiting") return { ok: false, reason: "Waiting for location…" };
    if (!isPresenceActive) return { ok: false, reason: "Presence row not yet active — refreshing…" };
    return { ok: true, reason: "You will receive nearby alerts." };
  })();

  const handleToggleOptIn = async () => {
    setTogglingOptIn(true);
    setActionError(null);
    const nextState = !optedIn;

    if (nextState) {
      if (!("geolocation" in navigator)) {
        setActionError("Geolocation is not supported by your browser");
        setTogglingOptIn(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch("/api/sos/presence", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ opt_in: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            });
            const data = await res.json();
            if (res.ok) {
              setOptedIn(true);
              setIsPresenceActive(true);
              setSuccessMsg("Opted into nearby SOS alerts. Coarse location saved.");
              fetchStatus();
            } else {
              setActionError(data.error || "Failed to opt in");
            }
          } catch (err: unknown) {
            setActionError((err as Error).message || "Failed to opt in");
          } finally {
            setTogglingOptIn(false);
          }
        },
        (err) => {
          setActionError(`Location permission required: ${err.message}`);
          setTogglingOptIn(false);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    } else {
      try {
        const res = await fetch("/api/sos/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opt_in: false }),
        });
        if (res.ok) {
          setOptedIn(false);
          setIsPresenceActive(false);
          setSuccessMsg("Opted out of nearby SOS alerts.");
          fetchStatus();
        }
      } catch (err: unknown) {
        setActionError((err as Error).message || "Failed to opt out");
      } finally {
        setTogglingOptIn(false);
      }
    }
  };

  const handleTriggerSos = async () => {
    if (!confirm("Are you sure you want to broadcast an SOS alert to nearby travellers?")) return;
    setTriggering(true);
    setActionError(null);

    if (!("geolocation" in navigator)) {
      setActionError("GPS location required to send SOS alert");
      setTriggering(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              note: sosNote.trim() || undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setActionError(data.error || "Failed to trigger SOS");
            return;
          }
          setSosNote("");
          const count = data?.alert?.recipient_count ?? 0;
          setSuccessMsg(
            count === 0
              ? "SOS Broadcast sent! No nearby opted-in helpers right now."
              : `SOS Broadcast sent! Alerted ${count} nearby verified traveller${count === 1 ? "" : "s"}.`
          );
          fetchStatus();
        } catch (err: unknown) {
          setActionError((err as Error).message || "Failed to trigger SOS");
        } finally {
          setTriggering(false);
        }
      },
      (err) => {
        setActionError(`Cannot get GPS location for SOS: ${err.message}`);
        setTriggering(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleResolveSos = async (status: "resolved" | "false_alarm") => {
    if (!myActiveSos) return;
    try {
      const res = await fetch(`/api/sos/${myActiveSos.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSuccessMsg(status === "resolved" ? "SOS resolved safely." : "SOS marked as false alarm.");
        fetchStatus();
      }
    } catch (err) {
      console.error("Failed to resolve SOS:", err);
    }
  };

  const handleRespond = async (sosId: string) => {
    setRespondingTo(sosId);
    try {
      const res = await fetch(`/api/sos/${sosId}/respond`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.latitude && data.longitude) {
        setRevealedCoords((prev) => ({ ...prev, [sosId]: { lat: data.latitude, lng: data.longitude } }));
        setSuccessMsg(`Response sent to ${data.sender_name}! Location coordinates revealed below.`);
        fetchStatus();
      }
    } catch (err) {
      console.error("Failed to respond to SOS:", err);
    } finally {
      setRespondingTo(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--soft)" }}>
          <RefreshCw size={18} className="animate-spin" />
          <span style={{ fontFamily: "inherit", fontSize: "0.9rem" }}>Loading SOS status…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        paddingTop: 80,
        paddingBottom: 100,
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#ef4444",
            textTransform: "uppercase",
            margin: "0 0 6px 0",
            fontFamily: "inherit",
          }}>
            SOLO SAFETY
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text)", fontFamily: "inherit" }}>
            Emergency SOS
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: 0, fontFamily: "inherit" }}>
            Rapid nearby peer-to-peer assistance for heritage travellers within {(SOS_RADIUS_METRES / 1000).toFixed(0)} km.
          </p>
        </div>

        {/* ── Emergency Services Disclaimer ───────────────────────── */}
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(239, 68, 68, 0.10)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: 14,
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 240 }}>
            <AlertOctagon size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f87171", marginBottom: 2, fontFamily: "inherit" }}>
                Emergency Services Notice
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(252,165,165,0.9)", lineHeight: 1.4, fontFamily: "inherit" }}>
                <strong>This alerts nearby app users only. It does NOT contact emergency services.</strong>{" "}
                In life-threatening emergencies, call national emergency services immediately.
              </div>
            </div>
          </div>
          <a
            href="tel:112"
            style={{
              ...pillBtn("#dc2626", "#fff"),
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            <PhoneCall size={15} /> Dial 112
          </a>
        </div>

        {/* ── Feedback Messages ───────────────────────────────────── */}
        {actionError && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 10,
              color: "#f87171",
              fontSize: "0.85rem",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "inherit",
            }}
          >
            <AlertTriangle size={15} /> {actionError}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 10,
              color: "#34d399",
              fontSize: "0.85rem",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "inherit",
            }}
          >
            <CheckCircle size={15} /> {successMsg}
          </div>
        )}

        {/* ── Active SOS (sent by me) ──────────────────────────────── */}
        {myActiveSos && (
          <div
            style={{
              ...panelStyle,
              background: "linear-gradient(135deg, rgba(239,68,68,0.18) 0%, var(--panel) 100%)",
              border: "2px solid #ef4444",
              boxShadow: "0 0 28px rgba(239,68,68,0.22)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} className="animate-pulse" />
              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#f87171", letterSpacing: "0.06em", fontFamily: "inherit" }}>
                YOUR SOS IS ACTIVE
              </span>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text)", margin: "0 0 8px 0", fontFamily: "inherit" }}>
              {myActiveSos.note ? `Note: "${myActiveSos.note}"` : "Emergency SOS beacon triggered."}
            </p>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 14, fontFamily: "inherit" }}>
              Broadcasted to <strong style={{ color: "var(--soft)" }}>{myActiveSos.recipient_count} verified travellers</strong> within 2 km · Sent at {new Date(myActiveSos.created_at).toLocaleTimeString()}
            </div>

            {myActiveSos.sos_responses && myActiveSos.sos_responses.length > 0 && (
              <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.12)", borderRadius: 8, marginBottom: 14 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#34d399", marginBottom: 4, fontFamily: "inherit" }}>
                  {myActiveSos.sos_responses.length} {myActiveSos.sos_responses.length === 1 ? "helper has" : "helpers have"} responded:
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--soft)", fontFamily: "inherit" }}>
                  {myActiveSos.sos_responses.map((r) => r.profiles?.display_name || "Traveller").join(", ")}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => handleResolveSos("resolved")} style={pillBtn("#10b981", "#fff")}>
                <CheckCircle size={15} /> Mark as Resolved
              </button>
              <button onClick={() => handleResolveSos("false_alarm")} style={pillBtn("var(--hover)", "var(--soft)")}>
                False Alarm
              </button>
            </div>
          </div>
        )}

        {/* ── Big SOS Trigger Button ───────────────────────────────── */}
        {!myActiveSos && (
          <div style={{ ...panelStyle, textAlign: "center" }}>
            <button
              onClick={handleTriggerSos}
              disabled={triggering}
              aria-label="Trigger SOS broadcast"
              style={{
                width: 130,
                height: 130,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                border: "4px solid rgba(255,255,255,0.18)",
                boxShadow: "0 0 38px rgba(239,68,68,0.45)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                cursor: triggering ? "not-allowed" : "pointer",
                margin: "0 auto 18px auto",
                opacity: triggering ? 0.7 : 1,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              <AlertOctagon size={42} strokeWidth={2.5} />
              <span style={{ fontSize: "1.1rem", fontWeight: 800, marginTop: 4, fontFamily: "inherit" }}>SOS</span>
            </button>

            <div style={{ maxWidth: 380, margin: "0 auto 14px auto" }}>
              <input
                type="text"
                placeholder="Optional short note (e.g. Lost near East Gate)"
                value={sosNote}
                onChange={(e) => setSosNote(e.target.value)}
                maxLength={100}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  color: "var(--text)",
                  padding: "10px 14px",
                  fontSize: "0.85rem",
                  fontFamily: "inherit",
                  outline: "none",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ fontSize: "0.76rem", color: "var(--muted)", maxWidth: 360, margin: "0 auto", fontFamily: "inherit", lineHeight: 1.5 }}>
              Rate limited to <strong style={{ color: "var(--soft)" }}>{SOS_RATE_LIMIT_PER_HOUR} alerts per hour</strong>.
              Coordinates rounded to ~100 m coarse precision until helper confirms assistance.
            </div>
          </div>
        )}

        {/* ── Opt-In Toggle ───────────────────────────────────────── */}
        <div
          style={{
            ...panelStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: optedIn ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: optedIn ? "#10b981" : "var(--muted)",
                border: "1px solid var(--line)",
              }}
            >
              <Radio size={20} className={optedIn ? "animate-pulse" : ""} />
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", fontFamily: "inherit" }}>
                Receive Nearby SOS Alerts
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--muted)", fontFamily: "inherit", marginTop: 2 }}>
                {optedIn
                  ? "Active (Stores ~100 m coarse location, 30 m TTL refreshed while app is open)"
                  : "Default off. Opt-in to receive alerts when travellers need help within 2 km."}
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleOptIn}
            disabled={togglingOptIn || !isVerified}
            style={pillBtn(
              optedIn ? "var(--hover)" : "#fff",
              optedIn ? "var(--soft)" : "#0b0f12"
            )}
          >
            {togglingOptIn ? <RefreshCw size={14} className="animate-spin" /> : optedIn ? "Opt Out" : "Opt In"}
          </button>
        </div>

        {/* ── Eligibility Status Line ─────────────────────────────── */}
        <div
          style={{
            marginBottom: 20,
            padding: "9px 14px",
            borderRadius: 10,
            background: eligibilityLine.ok ? "rgba(16,185,129,0.09)" : "rgba(251,191,36,0.09)",
            border: `1px solid ${eligibilityLine.ok ? "rgba(16,185,129,0.28)" : "rgba(251,191,36,0.28)"}`,
            fontSize: "0.8rem",
            color: eligibilityLine.ok ? "#34d399" : "#fbbf24",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
        >
          <Info size={14} style={{ flexShrink: 0 }} />
          {eligibilityLine.reason}
        </div>

        {/* ── Incoming SOS Alerts ─────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <ShieldAlert size={18} color="#B99A65" />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0, color: "var(--text)", fontFamily: "inherit" }}>
              Incoming SOS Alerts ({incomingAlerts.length})
            </h2>
          </div>

          {!optedIn ? (
            <div
              style={{
                ...panelStyle,
                textAlign: "center",
                border: "1px dashed var(--line)",
                color: "var(--muted)",
                fontSize: "0.85rem",
                fontFamily: "inherit",
              }}
            >
              You have not opted into nearby SOS alerts. Opt in above to receive alerts from nearby travellers within 2 km.
            </div>
          ) : incomingAlerts.length === 0 ? (
            <div
              style={{
                ...panelStyle,
                textAlign: "center",
                border: "1px dashed var(--line)",
                color: "var(--muted)",
                fontSize: "0.85rem",
                fontFamily: "inherit",
              }}
            >
              No active SOS alerts in your 2 km vicinity. Staying vigilant!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {incomingAlerts.map((alert) => {
                const coords =
                  revealedCoords[alert.id] ||
                  (alert.latitude && alert.longitude ? { lat: alert.latitude, lng: alert.longitude } : null);
                const hasResponded = alert.has_responded || !!revealedCoords[alert.id];

                return (
                  <div
                    key={alert.id}
                    style={{
                      ...panelStyle,
                      background: "rgba(239,68,68,0.07)",
                      border: "1px solid rgba(239,68,68,0.28)",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f87171", fontFamily: "inherit" }}>
                          🚨 SOS: {alert.sender_display_name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 2, fontFamily: "inherit" }}>
                          Approx <strong style={{ color: "var(--soft)" }}>{alert.approx_distance_m} metres away</strong>{" "}
                          · {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      {hasResponded && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: "rgba(16,185,129,0.18)",
                            color: "#34d399",
                            fontFamily: "inherit",
                          }}
                        >
                          ✓ Helping
                        </span>
                      )}
                    </div>

                    {alert.note && (
                      <div style={{ fontSize: "0.85rem", color: "var(--soft)", marginBottom: 12, fontStyle: "italic", fontFamily: "inherit" }}>
                        &quot;{alert.note}&quot;
                      </div>
                    )}

                    {coords && (
                      <div
                        style={{
                          padding: 10,
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: 8,
                          border: "1px solid var(--line)",
                          marginBottom: 12,
                          fontSize: "0.82rem",
                        }}
                      >
                        <div style={{ color: "var(--muted)", marginBottom: 4, fontFamily: "inherit" }}>Sender GPS Coordinates:</div>
                        <div style={{ fontWeight: 600, color: "#B99A65", marginBottom: 6, fontFamily: "inherit" }}>
                          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.8rem",
                            color: "#38bdf8",
                            textDecoration: "underline",
                            fontFamily: "inherit",
                          }}
                        >
                          <Navigation size={14} /> Open Navigation in Maps →
                        </a>
                      </div>
                    )}

                    {!hasResponded && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => handleRespond(alert.id)}
                          disabled={respondingTo === alert.id}
                          style={{ ...pillBtn("#10b981", "#fff"), flex: 1, justifyContent: "center" }}
                        >
                          {respondingTo === alert.id ? "Connecting..." : "I Can Help"}
                        </button>
                        <button
                          onClick={() => setIncomingAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                          style={{ ...pillBtn("var(--hover)", "var(--soft)"), padding: "9px 16px" }}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Info footer ─────────────────────────────────────────── */}
        <div style={{ marginTop: 32, display: "flex", alignItems: "flex-start", gap: 8, color: "var(--muted)", fontSize: "0.76rem", fontFamily: "inherit", lineHeight: 1.5 }}>
          <Clock size={13} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Presence expires 30 minutes after the app is closed. Reopen the page to refresh your location beacon.
            SOS alerts are limited to {SOS_RADIUS_METRES} m radius.
          </span>
        </div>
      </div>
    </div>
  );
}
