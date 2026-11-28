"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Users,
  MapPin,
  Clock,
  Radio,
  AlertTriangle,
  Send,
  Navigation,
  ArrowLeft,
  RefreshCw,
  PowerOff,
  Bell,
  AlertOctagon,
  Compass,
  Share2,
  UserPlus,
  Trash2,
} from "lucide-react";
import { GROUP_LOCATION_UPDATE_INTERVAL_SECONDS } from "@/config/constants";
import type { GroupMapMember } from "./GroupMap";

const GroupMap = dynamic(() => import("./GroupMap"), { ssr: false });

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

const sectionCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 16,
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#00C9A7",
  margin: 0,
};

export default function GroupLiveMapClient({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [locations, setLocations] = useState<GroupMapMember[]>([]);
  const [alerts, setAlerts] = useState<GroupAlertItem[]>([]);
  const [sharingOn, setSharingOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [customMsg, setCustomMsg] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [lastBroadcast, setLastBroadcast] = useState<Date | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GroupMapMember | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

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

    navigator.geolocation.getCurrentPosition(
      (pos) => broadcastLocation(pos.coords),
      (err) => setGeoError(`Location error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

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
    if (
      !confirm(
        "Are you sure you want to end this trip? All live location sharing will stop and location records will be purged."
      )
    ) {
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

  // Delete group permanently (owner only)
  const handleDeleteGroup = async () => {
    if (
      !confirm(
        `Permanently delete "${group?.name || "this group"}"? All trip locations, alerts, and memberships will be removed.`
      )
    ) {
      return;
    }
    setDeletingGroup(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/groups");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete group");
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
      setError("Network error while deleting group");
    } finally {
      setDeletingGroup(false);
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
      <div
        style={{
          minHeight: "calc(100dvh - 76px)",
          background: "var(--ink)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "var(--muted)",
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: 28,
            height: 28,
            border: "2px solid rgba(0, 201, 167, 0.2)",
            borderTopColor: "#00C9A7",
            borderRadius: "50%",
          }}
        />
        <span style={{ fontSize: "0.875rem" }}>Loading live group radar…</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div
        style={{
          minHeight: "calc(100dvh - 76px)",
          background: "var(--ink)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <p style={{ color: "#fca5a5", marginBottom: 16, fontSize: "0.95rem" }}>
          {error || "Group not found"}
        </p>
        <Link
          href="/groups"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 38,
            padding: "0 18px",
            borderRadius: 999,
            background: "var(--hover)",
            border: "1px solid var(--line)",
            color: "var(--text)",
            fontSize: "0.875rem",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={15} /> Back to Groups
        </Link>
      </div>
    );
  }

  // Default map center based on destination if no locations are live yet
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
    <div
      style={{
        minHeight: "calc(100dvh - 76px)",
        background: "var(--ink)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Sub-bar: Breadcrumb, Group Title, Trip Status & Actions */}
      <div
        style={{
          padding: "14px clamp(20px, 3.4vw, 40px)",
          borderBottom: "1px solid var(--line)",
          background: "var(--panel)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Link
            href="/groups"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 12px",
              borderRadius: 999,
              background: "var(--hover)",
              border: "1px solid var(--line)",
              fontSize: "0.8rem",
              color: "var(--soft)",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} /> All Groups
          </Link>

          <div>
            <h1
              style={{
                fontFamily: "inherit",
                fontSize: "1.125rem",
                fontWeight: 500,
                margin: 0,
                color: "var(--text)",
              }}
            >
              {group.name}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: "0.78rem",
                color: "var(--muted)",
                marginTop: 2,
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPin size={13} style={{ color: "#B99A65" }} />
                {group.destinations?.name || "Destination"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Clock size={13} />
                {new Date(group.starts_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {new Date(group.ends_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "5px 12px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: group.is_active_now ? "rgba(0, 201, 167, 0.12)" : "var(--hover)",
              color: group.is_active_now ? "#00C9A7" : "var(--muted)",
              border: group.is_active_now
                ? "1px solid rgba(0, 201, 167, 0.35)"
                : "1px solid var(--line)",
            }}
          >
            {group.is_active_now ? (
              <>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#00C9A7",
                    boxShadow: "0 0 8px rgba(0, 201, 167, 0.8)",
                    display: "inline-block",
                  }}
                />
                Trip Window Active
              </>
            ) : (
              "Trip Not Active"
            )}
          </span>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            style={{
              height: 32,
              padding: "0 12px",
              borderRadius: 999,
              background: "var(--hover)",
              border: "1px solid var(--line)",
              color: linkCopied ? "#00C9A7" : "var(--soft)",
              fontSize: "0.78rem",
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Share2 size={13} />
            {linkCopied ? "Copied!" : "Share Link"}
          </button>

          {group.is_owner ? (
            <>
              <button
                onClick={handleEndTrip}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.35)",
                  color: "#fca5a5",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                End Trip Early
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deletingGroup}
                aria-label="Delete group"
                title="Delete group permanently"
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "rgba(220, 38, 38, 0.18)",
                  border: "1px solid rgba(220, 38, 38, 0.45)",
                  color: "#fecaca",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  cursor: deletingGroup ? "not-allowed" : "pointer",
                  opacity: deletingGroup ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Trash2 size={13} />
                {deletingGroup ? "Deleting…" : "Delete"}
              </button>
            </>
          ) : (
            <button
              onClick={handleLeaveGroup}
              style={{
                height: 32,
                padding: "0 12px",
                borderRadius: 999,
                background: "var(--hover)",
                border: "1px solid var(--line)",
                color: "var(--muted)",
                fontSize: "0.78rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Leave Group
            </button>
          )}
        </div>
      </div>

      {/* Geolocation Error Banner */}
      {geoError && (
        <div
          style={{
            margin: "12px clamp(20px, 3.4vw, 40px) 0",
            padding: "10px 14px",
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.35)",
            borderRadius: 10,
            color: "#fca5a5",
            fontSize: "0.84rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          {geoError}
        </div>
      )}

      {/* 2-Column Dashboard Layout (Aligned with Solo Mode) */}
      <div className="wl-group-dashboard">
        {/* Left Sidebar */}
        <aside className="wl-group-sidebar">
          {/* 1. Location Sharing Control */}
          <div
            style={{
              ...sectionCardStyle,
              background: sharingOn
                ? "linear-gradient(145deg, rgba(0, 201, 167, 0.12) 0%, rgba(14, 19, 23, 0.85) 100%)"
                : "rgba(255, 255, 255, 0.03)",
              borderColor: sharingOn ? "rgba(0, 201, 167, 0.45)" : "var(--line)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: sharingOn ? "rgba(0, 201, 167, 0.18)" : "var(--hover)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: sharingOn ? "#00C9A7" : "var(--muted)",
                  flexShrink: 0,
                }}
              >
                <Radio size={17} className={sharingOn ? "animate-pulse" : ""} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: sharingOn ? "#00C9A7" : "var(--text)",
                  }}
                >
                  {sharingOn ? "Live Sharing Active" : "Location Sharing Paused"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {sharingOn
                    ? lastBroadcast
                      ? `Synced ${lastBroadcast.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })} (10s)`
                      : "Syncing every 10s…"
                    : "You are invisible to group members"}
                </div>
              </div>
            </div>

            <button
              onClick={toggleSharing}
              disabled={sharingLoading || !group.is_active_now}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 999,
                background: sharingOn ? "var(--hover)" : "#fff",
                border: sharingOn ? "1px solid var(--line)" : "none",
                color: sharingOn ? "var(--text)" : "#0b0f12",
                fontSize: "0.84rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: sharingLoading || !group.is_active_now ? "not-allowed" : "pointer",
                opacity: sharingLoading || !group.is_active_now ? 0.55 : 1,
              }}
            >
              {sharingLoading ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : sharingOn ? (
                <>
                  <PowerOff size={14} /> Pause Sharing
                </>
              ) : (
                <>
                  <Navigation size={14} /> Share Location
                </>
              )}
            </button>
          </div>

          {/* 2. Live Member Radar */}
          <div style={sectionCardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 style={sectionTitleStyle}>Live Member Radar</h2>
              <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                {locations.length} live
              </span>
            </div>

            {locations.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>
                No members are currently sharing location. Enable sharing above to appear on the map.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {locations.map((loc) => {
                  const isSelected = selectedLocation?.user_id === loc.user_id;
                  return (
                    <button
                      key={loc.user_id}
                      onClick={() =>
                        setSelectedLocation(isSelected ? null : loc)
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: isSelected ? "rgba(185, 154, 101, 0.14)" : "var(--hover)",
                        border: isSelected
                          ? "1px solid rgba(185, 154, 101, 0.5)"
                          : "1px solid var(--line)",
                        color: "var(--text)",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: isSelected ? "#B99A65" : "#00C9A7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#0b1013",
                          flexShrink: 0,
                        }}
                      >
                        {loc.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {loc.display_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "#00C9A7",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#00C9A7",
                            }}
                          />
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Invite Member Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!inviteQuery.trim() || inviting) return;
                setInviting(true);
                setInviteFeedback(null);
                try {
                  const res = await fetch(`/api/groups/${groupId}/invite`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: inviteQuery.trim() }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setInviteFeedback({ ok: false, text: data.error || "Failed to invite" });
                  } else {
                    setInviteFeedback({
                      ok: true,
                      text: `Invited ${data.invited?.display_name || inviteQuery.trim()}`,
                    });
                    setInviteQuery("");
                    fetchGroup();
                  }
                } catch {
                  setInviteFeedback({ ok: false, text: "Network error sending invite" });
                } finally {
                  setInviting(false);
                }
              }}
              style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  placeholder="Invite by name or email…"
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--line)",
                    borderRadius: 999,
                    color: "var(--text)",
                    padding: "7px 12px",
                    fontSize: "0.78rem",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={inviting || !inviteQuery.trim()}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 999,
                    background: "#fff",
                    color: "#0b0f12",
                    border: "none",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: inviting || !inviteQuery.trim() ? "not-allowed" : "pointer",
                    opacity: inviting || !inviteQuery.trim() ? 0.5 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <UserPlus size={12} /> {inviting ? "…" : "Invite"}
                </button>
              </div>
              {inviteFeedback && (
                <p
                  style={{
                    fontSize: "0.74rem",
                    margin: "6px 0 0",
                    color: inviteFeedback.ok ? "#00C9A7" : "#fca5a5",
                  }}
                >
                  {inviteFeedback.text}
                </p>
              )}
            </form>
          </div>

          {/* 3. Group Safety Alerts */}
          <div style={sectionCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Bell size={14} style={{ color: "#B99A65" }} />
              <h2 style={{ ...sectionTitleStyle, color: "#B99A65" }}>Group Safety Alerts</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => sendAlert("need_help")}
                disabled={sendingAlert}
                style={{
                  height: 38,
                  padding: "0 10px",
                  borderRadius: 10,
                  background: "var(--danger)",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: sendingAlert ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
                }}
              >
                <AlertOctagon size={14} /> Need Help
              </button>

              <button
                onClick={() => sendAlert("regroup")}
                disabled={sendingAlert}
                style={{
                  height: 38,
                  padding: "0 10px",
                  borderRadius: 10,
                  background: "rgba(0, 201, 167, 0.12)",
                  border: "1px solid rgba(0, 201, 167, 0.35)",
                  color: "#00C9A7",
                  fontWeight: 500,
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: sendingAlert ? "not-allowed" : "pointer",
                }}
              >
                <Compass size={14} /> Regroup
              </button>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: alerts.length > 0 ? 12 : 0 }}>
              <input
                type="text"
                placeholder="Custom alert message…"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                maxLength={200}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 36,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  color: "var(--text)",
                  padding: "0 12px",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                onClick={() => sendAlert("custom_message")}
                disabled={sendingAlert || !customMsg.trim()}
                aria-label="Send custom alert"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#fff",
                  border: "none",
                  color: "#0b0f12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: sendingAlert || !customMsg.trim() ? "not-allowed" : "pointer",
                  opacity: sendingAlert || !customMsg.trim() ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                <Send size={14} />
              </button>
            </div>

            {alerts.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid var(--line)",
                  paddingTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {alerts.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      background:
                        a.type === "need_help" ? "rgba(220, 38, 38, 0.14)" : "var(--hover)",
                      border:
                        a.type === "need_help"
                          ? "1px solid rgba(220, 38, 38, 0.35)"
                          : "1px solid var(--line)",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "var(--text)" }}>
                        {a.profiles?.display_name || "Member"}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                        {new Date(a.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div style={{ color: a.type === "need_help" ? "#fca5a5" : "var(--soft)" }}>
                      {a.type === "need_help"
                        ? "Sent a NEED HELP alert!"
                        : a.type === "regroup"
                          ? "Requested everyone regroup"
                          : a.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Member Roster */}
          <div style={sectionCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Users size={14} style={{ color: "var(--soft)" }} />
              <h2 style={{ ...sectionTitleStyle, color: "var(--soft)" }}>
                Members ({group.members.length})
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.members.map((m) => (
                <div
                  key={m.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.025)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(0, 201, 167, 0.16)",
                      border: "1px solid rgba(0, 201, 167, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color: "#00C9A7",
                      flexShrink: 0,
                    }}
                  >
                    {m.profiles?.display_name?.charAt(0).toUpperCase() || "M"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.profiles?.display_name || "Member"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: m.sharing_on ? "#00C9A7" : "var(--muted)",
                      }}
                    >
                      {m.sharing_on
                        ? "Sharing Live"
                        : m.status === "invited"
                          ? "Invited"
                          : "Paused"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Interactive Dark Leaflet Map */}
        <div className="wl-group-map-area">
          <div style={{ flex: 1, position: "relative", minHeight: 420 }}>
            <GroupMap
              locations={locations}
              selectedUserId={selectedLocation?.user_id || null}
              defaultCenter={{ lat: centerLat, lng: centerLng }}
              onSelectMember={(member) => setSelectedLocation(member)}
            />

            {/* Floating Live Count Badge */}
            <div
              style={{
                position: "absolute",
                top: 14,
                left: 56,
                background: "var(--panel)",
                backdropFilter: "blur(22px) saturate(140%)",
                WebkitBackdropFilter: "blur(22px) saturate(140%)",
                border: "1px solid var(--line)",
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: "0.78rem",
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 7,
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <Radio size={13} style={{ color: "#00C9A7" }} />
              <span>
                <strong>{locations.length}</strong>{" "}
                {locations.length === 1 ? "member" : "members"} sharing live
              </span>
            </div>

            {selectedLocation && (
              <button
                onClick={() => setSelectedLocation(null)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "var(--panel)",
                  backdropFilter: "blur(22px) saturate(140%)",
                  WebkitBackdropFilter: "blur(22px) saturate(140%)",
                  border: "1px solid rgba(185, 154, 101, 0.5)",
                  color: "#B99A65",
                  fontWeight: 500,
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: "0.78rem",
                  zIndex: 10,
                  cursor: "pointer",
                }}
              >
                Focused: {selectedLocation.display_name} ×
              </button>
            )}
          </div>

          {/* Bottom Status Bar (Aligned with Solo Mode) */}
          <div
            style={{
              height: 38,
              background: "var(--panel)",
              borderTop: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              gap: 20,
              fontSize: "0.75rem",
              color: "var(--muted)",
              fontFamily: "monospace",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: sharingOn ? "#00C9A7" : "var(--muted)",
                  boxShadow: sharingOn ? "0 0 6px rgba(0, 201, 167, 0.7)" : "none",
                }}
              />
              {sharingOn ? "Broadcast Active" : "Sharing Paused"}
            </span>
            <span>Poll Interval: 10s</span>
            {lastBroadcast && (
              <span>
                Last synced{" "}
                {lastBroadcast.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .wl-group-dashboard {
          display: grid;
          grid-template-columns: 350px 1fr;
          flex: 1;
          min-height: calc(100dvh - 145px);
          background: var(--ink);
        }
        .wl-group-sidebar {
          background: var(--ink);
          border-right: 1px solid var(--line);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          max-height: calc(100dvh - 145px);
        }
        .wl-group-map-area {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: calc(100dvh - 145px);
        }
        @media (max-width: 900px) {
          .wl-group-dashboard {
            grid-template-columns: 1fr;
            min-height: auto;
            padding-bottom: 76px;
          }
          .wl-group-sidebar {
            border-right: none;
            border-bottom: 1px solid var(--line);
            max-height: none;
            order: 2;
          }
          .wl-group-map-area {
            min-height: 440px;
            height: 55vh;
            order: 1;
          }
        }
      `}</style>
    </div>
  );
}
