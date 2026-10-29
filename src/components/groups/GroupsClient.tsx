"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Radio,
  Check,
  X,
  AlertCircle,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

interface GroupItem {
  id: string;
  name: string;
  destination_id: string;
  starts_at: string;
  ends_at: string;
  status: "active" | "ended" | "cancelled";
  is_owner: boolean;
  membership_status: "invited" | "accepted" | "left";
  sharing_on: boolean;
  is_active_now: boolean;
  destinations?: { id: string; name: string; region: string };
  profiles?: { id: string; display_name: string; avatar_url: string | null };
}

export default function GroupsClient() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load groups");
        return;
      }
      setGroups(data.groups || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleRespond = async (groupId: string, action: "accept" | "decline") => {
    try {
      setActionLoading(groupId);
      const res = await fetch(`/api/groups/${groupId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchGroups();
      }
    } catch (err) {
      console.error("Failed to respond:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const activeGroups = groups.filter(
    (g) => g.is_active_now && g.membership_status === "accepted"
  );
  const pendingInvites = groups.filter((g) => g.membership_status === "invited");
  const otherGroups = groups.filter(
    (g) => !g.is_active_now && g.membership_status === "accepted"
  );

  return (
    <div className="container" style={{ paddingBottom: 80, maxWidth: 900 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: 24,
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1
              className="font-display"
              style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}
            >
              Travel Groups
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(232, 168, 56, 0.15)",
                color: "var(--accent-gold)",
                fontWeight: 600,
                border: "1px solid rgba(232, 168, 56, 0.3)",
              }}
            >
              Feature 1A
            </span>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
            Real-time live location radar and safety alerts during active trips.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            fontSize: "0.9rem",
          }}
        >
          <Plus size={18} />
          Create Travel Group
        </button>
      </div>

      {/* Pending Invitations Banner */}
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-gold)" }}>
              Pending Invitations ({pendingInvites.length})
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingInvites.map((group) => (
              <div
                key={group.id}
                className="card"
                style={{
                  background: "rgba(232, 168, 56, 0.05)",
                  border: "1px solid rgba(232, 168, 56, 0.25)",
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                    {group.name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 4,
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={14} /> {group.destinations?.name || "Destination"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={14} /> {new Date(group.starts_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleRespond(group.id, "decline")}
                    disabled={actionLoading === group.id}
                    className="btn-secondary"
                    style={{
                      padding: "8px 14px",
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <X size={15} /> Decline
                  </button>
                  <button
                    onClick={() => handleRespond(group.id, "accept")}
                    disabled={actionLoading === group.id}
                    className="btn-primary"
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Check size={15} /> Accept Invitation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Live Trips (Top Priority) */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Radio size={18} color="#10b981" className="animate-pulse" />
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Live Active Trips
          </h2>
        </div>

        {activeGroups.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 24,
              textAlign: "center",
              background: "#1c1917",
              border: "1px dashed var(--border)",
            }}
          >
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No trips currently active. Groups become live during their scheduled trip window.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {activeGroups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="card"
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(28, 25, 23, 0.9) 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    padding: 20,
                    cursor: "pointer",
                    position: "relative",
                    transition: "transform 0.15s, border-color 0.15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#34d399",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#10b981",
                        display: "inline-block",
                      }}
                    />
                    LIVE RADAR ACTIVE
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                    {group.name}
                  </h3>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <MapPin size={15} color="var(--accent-gold)" />
                      {group.destinations?.name || "Destination"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={15} />
                      Ends {new Date(group.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      paddingTop: 12,
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: group.sharing_on ? "#34d399" : "var(--text-muted)" }}>
                      {group.sharing_on ? "📍 Location Sharing On" : "⏸️ Location Paused"}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.85rem",
                        color: "var(--accent-gold)",
                        fontWeight: 600,
                      }}
                    >
                      Open Live Map <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Other Trips (Scheduled / Past) */}
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 14, color: "var(--text-primary)" }}>
          Scheduled & Past Trips
        </h2>

        {otherGroups.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 24,
              textAlign: "center",
              background: "#1c1917",
              border: "1px dashed var(--border)",
            }}
          >
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No other travel groups yet. Create one above to plan your next heritage exploration!
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {otherGroups.map((group) => {
              const isPast = new Date(group.ends_at) < new Date() || group.status === "ended";
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card"
                    style={{
                      background: "#1c1917",
                      border: "1px solid var(--border)",
                      padding: 18,
                      cursor: "pointer",
                      opacity: isPast ? 0.75 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: isPast ? "rgba(255,255,255,0.06)" : "rgba(232,168,56,0.15)",
                          color: isPast ? "var(--text-muted)" : "var(--accent-gold)",
                        }}
                      >
                        {isPast ? "Trip Completed" : "Upcoming Trip"}
                      </span>
                      {group.is_owner && (
                        <span style={{ fontSize: "0.72rem", color: "var(--accent-gold)", fontWeight: 600 }}>
                          Owner
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                      {group.name}
                    </h3>

                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <MapPin size={14} />
                        {group.destinations?.name || "Destination"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} />
                        {new Date(group.starts_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: 10,
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      View Trip Details →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGroupCreated={(newGroup) => {
          setGroups((prev) => [newGroup, ...prev]);
        }}
      />
    </div>
  );
}

