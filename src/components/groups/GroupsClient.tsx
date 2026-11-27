"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  Plus,
  Radio,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  Compass,
  Users,
} from "lucide-react";
import type { Destination } from "@/types/database";
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

interface GroupsClientProps {
  initialDestinations?: Destination[];
}

/* ─── Shared Design-System Tokens ─────────────────────────────────── */
const panelStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
};

const emptyCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.02)",
  border: "1px dashed var(--line)",
  borderRadius: 14,
  padding: "28px 24px",
  textAlign: "center",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: "0.8125rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  margin: 0,
};

export default function GroupsClient({ initialDestinations = [] }: GroupsClientProps) {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
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
    <div
      style={{
        minHeight: "calc(100dvh - 76px)",
        background: "var(--ink)",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "36px clamp(20px, 3.4vw, 48px) 96px",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: "1px solid var(--line)",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#00C9A7",
                background: "rgba(0, 201, 167, 0.1)",
                border: "1px solid rgba(0, 201, 167, 0.3)",
                borderRadius: 999,
                padding: "4px 12px",
                marginBottom: 10,
              }}
            >
              <Users size={12} />
              Group Travel Radar
            </span>
            <h1
              style={{
                fontFamily: "inherit",
                fontSize: "clamp(1.6rem, 3.2vw, 2.1rem)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                margin: "0 0 6px 0",
                color: "var(--text)",
              }}
            >
              Travel Groups
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Synchronized live location sharing and instant safety alerts during active trip windows.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/solo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 38,
                padding: "0 16px",
                borderRadius: 999,
                background: "var(--hover)",
                border: "1px solid var(--line)",
                color: "var(--soft)",
                fontSize: "0.84rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "background 0.25s var(--ease), color 0.25s var(--ease)",
              }}
            >
              <Compass size={15} style={{ color: "#B99A65" }} />
              Solo Mode
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 18px",
                borderRadius: 999,
                background: "#fff",
                color: "#0b0f12",
                border: "none",
                fontFamily: "inherit",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.25s var(--ease), transform 0.25s var(--ease)",
              }}
            >
              <Plus size={16} />
              Create Travel Group
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(220, 38, 38, 0.1)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              color: "#fca5a5",
              fontSize: "0.875rem",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchGroups}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                color: "var(--text)",
                padding: "4px 12px",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div
            style={{
              ...panelStyle,
              padding: "56px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
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
            <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
              Loading your travel groups…
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            {/* Pending Invitations */}
            {pendingInvites.length > 0 && (
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <h2 style={{ ...sectionHeadingStyle, color: "#B99A65" }}>
                    Pending Invitations ({pendingInvites.length})
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingInvites.map((group) => (
                    <div
                      key={group.id}
                      style={{
                        ...panelStyle,
                        borderColor: "rgba(185, 154, 101, 0.35)",
                        padding: "18px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 14,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontFamily: "inherit",
                            fontSize: "1.05rem",
                            fontWeight: 500,
                            margin: 0,
                            color: "var(--text)",
                          }}
                        >
                          {group.name}
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            marginTop: 6,
                            fontSize: "0.82rem",
                            color: "var(--muted)",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <MapPin size={14} style={{ color: "#B99A65" }} />
                            {group.destinations?.name || "Destination"}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Clock size={14} />
                            {new Date(group.starts_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleRespond(group.id, "decline")}
                          disabled={actionLoading === group.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            height: 34,
                            padding: "0 14px",
                            borderRadius: 999,
                            background: "var(--hover)",
                            border: "1px solid var(--line)",
                            color: "var(--soft)",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} /> Decline
                        </button>
                        <button
                          onClick={() => handleRespond(group.id, "accept")}
                          disabled={actionLoading === group.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            height: 34,
                            padding: "0 16px",
                            borderRadius: 999,
                            background: "#fff",
                            border: "none",
                            color: "#0b0f12",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          <Check size={14} /> Accept Invitation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Active Live Trips */}
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Radio size={15} style={{ color: "#00C9A7" }} className="animate-pulse" />
                <h2 style={sectionHeadingStyle}>Live Active Trips</h2>
              </div>

              {activeGroups.length === 0 ? (
                <div style={emptyCardStyle}>
                  <p style={{ margin: "0 0 4px 0", color: "var(--soft)", fontSize: "0.9375rem", fontWeight: 500 }}>
                    No trips currently active
                  </p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.84rem" }}>
                    Groups automatically become live during their scheduled trip window.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                  }}
                >
                  {activeGroups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          ...panelStyle,
                          background:
                            "linear-gradient(145deg, rgba(0, 201, 167, 0.08) 0%, rgba(14, 19, 23, 0.9) 100%)",
                          borderColor: "rgba(0, 201, 167, 0.35)",
                          padding: 20,
                          cursor: "pointer",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "transform 0.25s var(--ease), border-color 0.25s var(--ease)",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "#00C9A7",
                              marginBottom: 10,
                            }}
                          >
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
                            Live Radar Active
                          </div>

                          <h3
                            style={{
                              fontFamily: "inherit",
                              fontSize: "1.125rem",
                              fontWeight: 500,
                              margin: "0 0 10px 0",
                              color: "var(--text)",
                            }}
                          >
                            {group.name}
                          </h3>

                          <div
                            style={{
                              fontSize: "0.84rem",
                              color: "var(--muted)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 5,
                              marginBottom: 18,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <MapPin size={14} style={{ color: "#B99A65" }} />
                              <span>{group.destinations?.name || "Destination"}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Clock size={14} />
                              <span>
                                Ends{" "}
                                {new Date(group.ends_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderTop: "1px solid var(--line)",
                            paddingTop: 12,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: group.sharing_on ? "#00C9A7" : "var(--muted)",
                              fontWeight: 500,
                            }}
                          >
                            {group.sharing_on ? "Location Sharing On" : "Location Paused"}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: "0.84rem",
                              color: "var(--text)",
                              fontWeight: 500,
                            }}
                          >
                            Open Live Map <ArrowRight size={15} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Scheduled & Past Trips */}
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Calendar size={15} style={{ color: "var(--muted)" }} />
                <h2 style={sectionHeadingStyle}>Scheduled &amp; Past Trips</h2>
              </div>

              {otherGroups.length === 0 ? (
                <div style={emptyCardStyle}>
                  <p style={{ margin: "0 0 4px 0", color: "var(--soft)", fontSize: "0.9375rem", fontWeight: 500 }}>
                    No other travel groups yet
                  </p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.84rem" }}>
                    Create a travel group above to coordinate live locations and alerts with your party.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                    gap: 16,
                  }}
                >
                  {otherGroups.map((group) => {
                    const isPast = new Date(group.ends_at) < new Date() || group.status === "ended";
                    return (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div
                          style={{
                            ...panelStyle,
                            padding: 20,
                            cursor: "pointer",
                            opacity: isPast ? 0.72 : 1,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            transition: "border-color 0.25s var(--ease)",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  padding: "3px 10px",
                                  borderRadius: 999,
                                  background: isPast
                                    ? "var(--hover)"
                                    : "rgba(185, 154, 101, 0.14)",
                                  border: isPast
                                    ? "1px solid var(--line)"
                                    : "1px solid rgba(185, 154, 101, 0.3)",
                                  color: isPast ? "var(--muted)" : "#B99A65",
                                }}
                              >
                                {isPast ? "Trip Completed" : "Upcoming Trip"}
                              </span>
                              {group.is_owner && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "#00C9A7",
                                    fontWeight: 500,
                                  }}
                                >
                                  Owner
                                </span>
                              )}
                            </div>

                            <h3
                              style={{
                                fontFamily: "inherit",
                                fontSize: "1.05rem",
                                fontWeight: 500,
                                margin: "0 0 10px 0",
                                color: "var(--text)",
                              }}
                            >
                              {group.name}
                            </h3>

                            <div
                              style={{
                                fontSize: "0.82rem",
                                color: "var(--muted)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 5,
                                marginBottom: 16,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <MapPin size={14} style={{ color: "var(--soft)" }} />
                                <span>{group.destinations?.name || "Destination"}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Calendar size={14} />
                                <span>{new Date(group.starts_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              gap: 4,
                              borderTop: "1px solid var(--line)",
                              paddingTop: 12,
                              fontSize: "0.82rem",
                              color: "var(--soft)",
                              fontWeight: 500,
                            }}
                          >
                            View Trip Details <ArrowRight size={14} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDestinations={initialDestinations}
        onGroupCreated={(newGroup) => {
          setGroups((prev) => [newGroup, ...prev]);
        }}
      />
    </div>
  );
}
