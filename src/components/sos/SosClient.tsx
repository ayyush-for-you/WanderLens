"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  ShieldAlert,
  PhoneCall,
  CheckCircle,
  AlertTriangle,
  Radio,
  MapPin,
  Clock,
  Send,
  Eye,
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

  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    // Refresh incoming alerts every 5 seconds for responsive safety delivery
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Keep presence alive if optedIn is true
  useEffect(() => {
    if (!optedIn) {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      return;
    }

    const refreshPresence = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
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
          (err) => console.warn("Presence GPS error:", err.message),
          { timeout: 8000, maximumAge: 10000 }
        );
      }
    };

    // Immediate ping + every 10 minutes (TTL is 30m)
    refreshPresence();
    presenceIntervalRef.current = setInterval(refreshPresence, 10 * 60 * 1000);

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
    };
  }, [optedIn]);

  // Toggle Opt-in
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
              body: JSON.stringify({
                opt_in: true,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
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
          } catch (err: any) {
            setActionError(err.message || "Failed to opt in");
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
      } catch (err: any) {
        setActionError(err.message || "Failed to opt out");
      } finally {
        setTogglingOptIn(false);
      }
    }
  };

  // Trigger SOS
  const handleTriggerSos = async () => {
    if (!confirm("Are you sure you want to broadcast an SOS alert to nearby travellers?")) {
      return;
    }

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
          setSuccessMsg(`SOS Broadcast sent! Alerted ${data.alert.recipient_count} nearby verified travellers.`);
          fetchStatus();
        } catch (err: any) {
          setActionError(err.message || "Failed to trigger SOS");
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

  // Resolve or false alarm
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

  // Respond "I can help"
  const handleRespond = async (sosId: string) => {
    setRespondingTo(sosId);
    try {
      const res = await fetch(`/api/sos/${sosId}/respond`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.latitude && data.longitude) {
        setRevealedCoords((prev) => ({
          ...prev,
          [sosId]: { lat: data.latitude, lng: data.longitude },
        }));
        setSuccessMsg(`Response sent to ${data.sender_name}! Location coordinates revealed below.`);
        fetchStatus();
      }
    } catch (err) {
      console.error("Failed to respond to SOS:", err);
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 80, maxWidth: 680 }}>
      {/* Title */}
      <div style={{ marginTop: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Solo Safety & SOS
          </h1>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              fontWeight: 700,
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            Feature 1B
          </span>
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
          Rapid nearby peer-to-peer assistance for heritage travellers within 2 km.
        </p>
      </div>

      {/* PRD MANDATED PERSISTENT DISCLAIMER */}
      <div
        style={{
          padding: 16,
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: 14,
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 260 }}>
          <AlertOctagon size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f87171", marginBottom: 2 }}>
              Emergency Services Notice
            </div>
            <div style={{ fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.4 }}>
              <strong>This alerts nearby app users only. It does NOT contact emergency services.</strong> In life-threatening emergencies, call national emergency services immediately.
            </div>
          </div>
        </div>

        <a
          href="tel:112"
          className="btn-primary"
          style={{
            background: "#dc2626",
            color: "#ffffff",
            padding: "8px 16px",
            fontSize: "0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          <PhoneCall size={16} /> Dial 112 (Police)
        </a>
      </div>

      {/* Feedback Messages */}
      {actionError && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 8,
            color: "#f87171",
            fontSize: "0.85rem",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={16} /> {actionError}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 8,
            color: "#34d399",
            fontSize: "0.85rem",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Active SOS Sent by Current User */}
      {myActiveSos && (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(28, 25, 23, 0.95) 100%)",
            border: "2px solid #ef4444",
            padding: 20,
            borderRadius: 14,
            marginBottom: 24,
            boxShadow: "0 0 25px rgba(239, 68, 68, 0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} className="animate-pulse" />
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f87171", letterSpacing: "0.05em" }}>
              YOUR SOS BROADCAST IS CURRENTLY ACTIVE
            </span>
          </div>

          <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", margin: "0 0 10px 0" }}>
            {myActiveSos.note ? `Note: "${myActiveSos.note}"` : "Emergency SOS beacon triggered."}
          </p>

          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 16 }}>
            Broadcasted to <strong>{myActiveSos.recipient_count} verified travellers</strong> within 2 km · Sent at {new Date(myActiveSos.created_at).toLocaleTimeString()}
          </div>

          {/* Helpers response count */}
          {myActiveSos.sos_responses && myActiveSos.sos_responses.length > 0 && (
            <div style={{ padding: "10px 14px", background: "rgba(16, 185, 129, 0.15)", borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#34d399", marginBottom: 4 }}>
                {myActiveSos.sos_responses.length} {myActiveSos.sos_responses.length === 1 ? "helper has" : "helpers have"} responded:
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>
                {myActiveSos.sos_responses.map((r) => r.profiles?.display_name || "Traveller").join(", ")}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleResolveSos("resolved")}
              className="btn-primary"
              style={{
                background: "#10b981",
                padding: "10px 16px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CheckCircle size={16} /> Mark as Resolved
            </button>
            <button
              onClick={() => handleResolveSos("false_alarm")}
              className="btn-secondary"
              style={{
                padding: "10px 16px",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              False Alarm
            </button>
          </div>
        </div>
      )}

      {/* Big Trigger SOS Button */}
      {!myActiveSos && (
        <div
          className="card"
          style={{
            background: "#1c1917",
            border: "1px solid var(--border)",
            padding: 24,
            borderRadius: 16,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button
              onClick={handleTriggerSos}
              disabled={triggering}
              style={{
                width: 130,
                height: 130,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                border: "4px solid rgba(255,255,255,0.2)",
                boxShadow: "0 0 35px rgba(239, 68, 68, 0.45)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                cursor: "pointer",
                marginBottom: 16,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              <AlertOctagon size={42} strokeWidth={2.5} />
              <span style={{ fontSize: "1.1rem", fontWeight: 800, marginTop: 4 }}>SOS</span>
            </button>

            <div style={{ width: "100%", maxWidth: 380, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Optional short note (e.g. Lost near East Gate)"
                value={sosNote}
                onChange={(e) => setSosNote(e.target.value)}
                maxLength={100}
                className="input-field"
                style={{ width: "100%", textAlign: "center", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: 360 }}>
              Rate limited to <strong>{SOS_RATE_LIMIT_PER_HOUR} alerts per hour</strong>. Excess attempts are rejected. Coordinates rounded to ~100 m coarse precision until helper confirms assistance.
            </div>
          </div>
        </div>
      )}

      {/* Opt-In Preference Switch */}
      <div
        className="card"
        style={{
          background: "#1c1917",
          border: "1px solid var(--border)",
          padding: 18,
          borderRadius: 14,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: optedIn ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: optedIn ? "#10b981" : "var(--text-muted)",
            }}
          >
            <Radio size={20} className={optedIn ? "animate-pulse" : ""} />
          </div>
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Receive Nearby SOS Alerts
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {optedIn
                ? "Active (Stores ~100m coarse location, 30m TTL refreshed while app is open)"
                : "Default off. Opt-in to receive alerts when travellers need help within 2 km."}
            </div>
          </div>
        </div>

        <button
          onClick={handleToggleOptIn}
          disabled={togglingOptIn || !isVerified}
          className={optedIn ? "btn-secondary" : "btn-primary"}
          style={{ padding: "8px 16px", fontSize: "0.82rem" }}
        >
          {togglingOptIn ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : optedIn ? (
            "Opt Out"
          ) : (
            "Opt In"
          )}
        </button>
      </div>

      {/* Incoming Nearby Alerts */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <ShieldAlert size={18} color="var(--accent-gold)" />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Incoming SOS Alerts ({incomingAlerts.length})
          </h2>
        </div>

        {!optedIn ? (
          <div
            className="card"
            style={{
              padding: 20,
              textAlign: "center",
              background: "#1c1917",
              border: "1px dashed var(--border)",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            You have not opted into nearby SOS alerts. Opt in above to receive alerts from nearby travellers within 2 km.
          </div>
        ) : incomingAlerts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 20,
              textAlign: "center",
              background: "#1c1917",
              border: "1px dashed var(--border)",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No active SOS alerts in your 2 km vicinity. Staying vigilant!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {incomingAlerts.map((alert) => {
              const coords = revealedCoords[alert.id] || (alert.latitude && alert.longitude ? { lat: alert.latitude, lng: alert.longitude } : null);
              const hasResponded = alert.has_responded || !!revealedCoords[alert.id];

              return (
                <div
                  key={alert.id}
                  className="card"
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    padding: 16,
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f87171" }}>
                        🚨 SOS: {alert.sender_display_name}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                        Approx <strong>{alert.approx_distance_m} metres away</strong> · {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {hasResponded && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#34d399",
                        }}
                      >
                        ✓ Helping
                      </span>
                    )}
                  </div>

                  {alert.note && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 12, fontStyle: "italic" }}>
                      "{alert.note}"
                    </div>
                  )}

                  {/* Revealed Location after tapping "I can help" */}
                  {coords && (
                    <div
                      style={{
                        padding: 10,
                        background: "rgba(24, 21, 18, 0.9)",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        marginBottom: 12,
                        fontSize: "0.82rem",
                      }}
                    >
                      <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>Sender GPS Coordinates:</div>
                      <div style={{ fontWeight: 600, color: "var(--accent-gold)", marginBottom: 6 }}>
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
                        className="btn-primary"
                        style={{
                          flex: 1,
                          padding: "8px 14px",
                          fontSize: "0.82rem",
                          background: "#10b981",
                        }}
                      >
                        {respondingTo === alert.id ? "Connecting..." : "I Can Help"}
                      </button>
                      <button
                        onClick={() => setIncomingAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                        className="btn-secondary"
                        style={{
                          padding: "8px 14px",
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                        }}
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
    </div>
  );
}

