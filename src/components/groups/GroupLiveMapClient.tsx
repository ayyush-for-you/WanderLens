"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  MapPin,
  Clock,
  Radio,
  AlertTriangle,
  Send,
  Navigation,
  Shield,
  ArrowLeft,
  RefreshCw,
  LogOut,
  PowerOff,
  Bell,
  CheckCircle,
} from "lucide-react";
import { GROUP_LOCATION_UPDATE_INTERVAL_SECONDS } from "@/config/constants";

interface MemberLocation {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface GroupAlertItem {
  id: string;
  group_id: string;
  from_user: string;
  type: "need_help" | "regroup" | "custom_message";
  body: string | null;
  created_at: string;
  profiles?: { id: string; display_name: string; avatar_url: string | null };
}

interface GroupDetail {
  id: string;
  name: string;
  destination_id: string;
  starts_at: string;
  ends_at: string;
  status: "active" | "ended" | "cancelled";
  is_owner: boolean;
  is_active_now: boolean;
  my_membership?: { status: string; sharing_on: boolean } | null;
  destinations?: { id: string; name: string; region: string };
  members: Array<{
    user_id: string;
    status: string;
    sharing_on: boolean;
    joined_at: string;
    profiles?: { id: string; display_name: string; avatar_url: string | null };
  }>;
}

export default function GroupLiveMapClient({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [locations, setLocations] = useState<MemberLocation[]>([]);
  const [alerts, setAlerts] = useState<GroupAlertItem[]>([]);
  const [sharingOn, setSharingOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [customMsg, setCustomMsg] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [lastBroadcast, setLastBroadcast] = useState<Date | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MemberLocation | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Fetch initial group info
  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load group");
        return;
      }
      setGroup(data.group);
      setSharingOn(data.group.my_membership?.sharing_on || false);
    } catch (err: any) {
      setError(err.message || "Failed to fetch group details");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Fetch locations of active sharing members
  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/locations`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error("Failed to poll locations:", err);
    }
  }, [groupId]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error("Failed to poll alerts:", err);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
    fetchLocations();
    fetchAlerts();

    // 10-second polling for locations and alerts (PRD requirement: paused members disappear within 10s)
    const interval = setInterval(() => {
      fetchLocations();
      fetchAlerts();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchGroup, fetchLocations, fetchAlerts]);

  // Send current location if sharing is ON
  const broadcastLocation = useCallback(
    async (coords: GeolocationCoordinates) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < GROUP_LOCATION_UPDATE_INTERVAL_SECONDS * 1000) {
        return; // Throttled to 10 seconds per PRD
      }
      lastUpdateRef.current = now;

      try {
        const res = await fetch(`/api/groups/${groupId}/locations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
        });

        if (res.ok) {
          setLastBroadcast(new Date());
          setGeoError(null);
          fetchLocations();
        }
      } catch (err) {
        console.error("Failed to push location:", err);
      }
    },
    [groupId, fetchLocations]
  );

  // Watch position when sharingOn is true
  useEffect(() => {
    if (!sharingOn || !group?.is_active_now) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    // Immediately get position once
    navigator.geolocation.getCurrentPosition(
      (pos) => broadcastLocation(pos.coords),
      (err) => setGeoError(`Location error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => broadcastLocation(pos.coords),
      (err) => setGeoError(`Location watch error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sharingOn, group?.is_active_now, broadcastLocation]);

  // Toggle location sharing
  const toggleSharing = async () => {
    if (!group) return;
    setSharingLoading(true);
    setGeoError(null);

    const nextState = !sharingOn;
    try {
      const res = await fetch(`/api/groups/${groupId}/sharing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharing_on: nextState }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGeoError(data.error || "Failed to update sharing mode");
        return;
      }

      setSharingOn(data.sharing_on);
      await fetchLocations();
      await fetchGroup();
    } catch (err: any) {
      setGeoError(err.message || "Failed to toggle location sharing");
    } finally {
      setSharingLoading(false);
    }
  };

  // Broadcast alert
  const sendAlert = async (type: "need_help" | "regroup" | "custom_message") => {
    if (type === "custom_message" && !customMsg.trim()) return;
    setSendingAlert(true);

    try {
      const res = await fetch(`/api/groups/${groupId}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          body: type === "custom_message" ? customMsg.trim() : null,
        }),
      });

      if (res.ok) {
        setCustomMsg("");
        await fetchAlerts();
      }
    } catch (err) {
      console.error("Failed to send alert:", err);
    } finally {
      setSendingAlert(false);
    }
  };

  // End trip early (owner only)
  const handleEndTrip = async () => {
    if (!confirm("Are you sure you want to end this trip? All live location sharing will stop and location records will be purged.")) {
      return;
    }
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      if (res.ok) {
        fetchGroup();
        fetchLocations();
      }
    } catch (err) {
      console.error("Failed to end trip:", err);
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      if (res.ok) {
        router.push("/groups");
      }
    } catch (err) {
      console.error("Failed to leave group:", err);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        Loading live group hub...
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container" style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#ef4444", marginBottom: 16 }}>{error || "Group not found"}</p>
        <Link href="/groups" className="btn-secondary" style={{ padding: "8px 16px" }}>
          Back to Groups
        </Link>
      </div>
    );
  }

  // Calculate map center
  let centerLat = 28.6139;
  let centerLng = 77.209;
  if (selectedLocation) {
    centerLat = selectedLocation.latitude;
    centerLng = selectedLocation.longitude;
  } else if (locations.length > 0) {
    centerLat = locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
    centerLng = locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;
  } else if (group.destinations?.name.toLowerCase().includes("jaipur")) {
    centerLat = 26.9124;
    centerLng = 75.7873;
  }

  return (
    <div className="container" style={{ paddingBottom: 80, maxWidth: 900 }}>
      {/* Back button & Title */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Link
          href="/groups"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            textDecoration: "none",
            marginBottom: 10,
          }}
        >
          <ArrowLeft size={16} /> All Groups
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
              {group.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={15} color="var(--accent-gold)" /> {group.destinations?.name || "Destination"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={15} />
                {new Date(group.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                {new Date(group.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* Trip Status Pill */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: group.is_active_now
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(255, 255, 255, 0.08)",
                color: group.is_active_now ? "#34d399" : "var(--text-muted)",
                border: group.is_active_now
                  ? "1px solid rgba(16, 185, 129, 0.4)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {group.is_active_now ? (
                <>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#10b981",
                      display: "inline-block",
                    }}
                  />
                  TRIP WINDOW ACTIVE
                </>
              ) : (
                "TRIP NOT ACTIVE"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Geolocation Error Notification */}
      {geoError && (
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
          <AlertTriangle size={16} />
          {geoError}
        </div>
      )}

      {/* PRD Mandated Sharing Indicator Bar */}
      <div
        className="card"
        style={{
          background: sharingOn
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(24, 21, 18, 0.95) 100%)"
            : "#1c1917",
          border: sharingOn ? "1px solid #10b981" : "1px solid var(--border)",
          padding: "14px 20px",
          borderRadius: 14,
          marginBottom: 20,
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
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: sharingOn ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: sharingOn ? "#10b981" : "var(--text-muted)",
            }}
          >
            <Radio size={22} className={sharingOn ? "animate-pulse" : ""} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: sharingOn ? "#34d399" : "var(--text-primary)",
              }}
            >
              {sharingOn
                ? "You are sharing your location with this group"
                : "Location sharing is currently paused"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {sharingOn
                ? lastBroadcast
                  ? `Last synced: ${lastBroadcast.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} (synced every 10s)`
                  : "Syncing location every 10 seconds..."
                : "You are invisible to other group members on this map."}
            </div>
          </div>
        </div>

        <button
          onClick={toggleSharing}
          disabled={sharingLoading || !group.is_active_now}
          className={sharingOn ? "btn-secondary" : "btn-primary"}
          style={{
            padding: "8px 18px",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {sharingLoading ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : sharingOn ? (
            <>
              <PowerOff size={15} /> Pause Sharing
            </>
          ) : (
            <>
              <Navigation size={15} /> Share Location
            </>
          )}
        </button>
      </div>

      {/* OpenStreetMap Interactive Live Display */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          position: "relative",
          height: 380,
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "#181512",
          marginBottom: 16,
        }}
      >
        <iframe
          title={`Group Map - ${group.name}`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.04}%2C${centerLat - 0.03}%2C${centerLng + 0.04}%2C${centerLat + 0.03}&layer=mapnik&marker=${centerLat}%2C${centerLng}`}
          style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(95%)" }}
        />

        {/* Live Active Sharers Counter Badge */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(24, 21, 18, 0.9)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: "0.78rem",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 10,
          }}
        >
          <Radio size={14} color="#10b981" />
          <span>
            <strong>{locations.length}</strong> {locations.length === 1 ? "member" : "members"} sharing live
          </span>
        </div>

        {/* Selected Member Pin indicator */}
        {selectedLocation && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(232, 168, 56, 0.95)",
              color: "#1a0800",
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: "0.78rem",
              zIndex: 10,
            }}
          >
            Focused: {selectedLocation.display_name}
          </div>
        )}
      </div>

      {/* Member Radar Cards (Horizontal List) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
          Live Member Radar (Updates every 10s):
        </div>

        {locations.length === 0 ? (
          <div
            style={{
              padding: 12,
              background: "#1c1917",
              borderRadius: 8,
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              border: "1px dashed var(--border)",
            }}
          >
            No members are currently sharing location. Enable sharing above to appear on the radar.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
            {locations.map((loc) => (
              <button
                key={loc.user_id}
                onClick={() => setSelectedLocation(loc)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: selectedLocation?.user_id === loc.user_id ? "rgba(232, 168, 56, 0.2)" : "#221f1c",
                  border: selectedLocation?.user_id === loc.user_id ? "1px solid var(--accent-gold)" : "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--gradient-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "#1a0800",
                  }}
                >
                  {loc.display_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{loc.display_name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#34d399", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                    Live ({loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)})
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Safety & Regroup Alerts Broadcast Panel */}
      <div
        className="card"
        style={{
          background: "#1c1917",
          border: "1px solid var(--border)",
          padding: 20,
          borderRadius: 14,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Bell size={18} color="var(--accent-gold)" />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Group Safety Alerts
          </h2>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => sendAlert("need_help")}
            disabled={sendingAlert}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#f87171",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            🚨 Need Help Alert
          </button>

          <button
            onClick={() => sendAlert("regroup")}
            disabled={sendingAlert}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(232, 168, 56, 0.15)",
              border: "1px solid rgba(232, 168, 56, 0.4)",
              color: "var(--accent-gold)",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            📍 Regroup Request
          </button>
        </div>

        {/* Custom message input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Send custom alert to group members..."
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            maxLength={200}
            className="input-field"
            style={{ flex: 1, fontSize: "0.85rem" }}
          />
          <button
            onClick={() => sendAlert("custom_message")}
            disabled={sendingAlert || !customMsg.trim()}
            className="btn-primary"
            style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Send size={15} /> Send
          </button>
        </div>

        {/* Recent Alerts Feed */}
        {alerts.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8 }}>
              Recent Alerts:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: a.type === "need_help" ? "rgba(239, 68, 68, 0.12)" : "rgba(255,255,255,0.04)",
                    border: a.type === "need_help" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255,255,255,0.06)",
                    fontSize: "0.82rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>
                      {a.type === "need_help" ? "🚨" : a.type === "regroup" ? "📍" : "💬"}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {a.profiles?.display_name || "Member"}:
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {a.type === "need_help" ? "Sent a NEED HELP alert!" : a.type === "regroup" ? "Requested everyone regroup!" : a.body}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Member Roster & Trip Controls */}
      <div
        className="card"
        style={{
          background: "#1c1917",
          border: "1px solid var(--border)",
          padding: 20,
          borderRadius: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color="var(--accent-gold)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Group Members ({group.members.length})
            </h2>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {group.is_owner ? (
              <button
                onClick={handleEndTrip}
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  color: "#f87171",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                }}
              >
                End Trip Early
              </button>
            ) : (
              <button
                onClick={handleLeaveGroup}
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                }}
              >
                Leave Group
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {group.members.map((m) => (
            <div
              key={m.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(232, 168, 56, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "var(--accent-gold)",
                }}
              >
                {m.profiles?.display_name?.charAt(0).toUpperCase() || "M"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.profiles?.display_name || "Member"}
                </div>
                <div style={{ fontSize: "0.72rem", color: m.sharing_on ? "#34d399" : "var(--text-muted)" }}>
                  {m.sharing_on ? "📍 Location Sharing On" : m.status === "invited" ? "⏳ Invited" : "⏸️ Location Paused"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

