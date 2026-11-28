"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  MessageCircle,
  MapPin,
  ArrowRight,
  Compass,
  Share2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Destination, Profile } from "@/types/database";
import CreateCommunityModal from "./CreateCommunityModal";

interface CommunityItem {
  id: string;
  name: string;
  description: string | null;
  destination_id: string;
  owner_id: string;
  created_at: string;
  member_count: number;
  is_member: boolean;
  is_owner: boolean;
  destinations?: { id: string; name: string; region: string };
  profiles?: { id: string; display_name: string; avatar_url: string | null };
}

interface CommunitiesClientProps {
  initialDestinations: Destination[];
  profile: Profile | null;
}

const panelStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
};

export default function CommunitiesClient({
  initialDestinations,
  profile,
}: CommunitiesClientProps) {
  const [destinations] = useState<Destination[]>(initialDestinations);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/communities";
      const params = new URLSearchParams();
      if (selectedDestinationId !== "all") {
        params.append("destination_id", selectedDestinationId);
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setCommunities(json.communities || []);
      }
    } catch {
      toast.error("Could not load communities");
    } finally {
      setLoading(false);
    }
  }, [selectedDestinationId, searchQuery]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Join Community handler
  const handleJoin = async (communityId: string) => {
    if (!profile) {
      toast.error("Please log in to join communities");
      return;
    }
    if (!profile.is_verified) {
      toast.error("Verify your email to join destination communities");
      return;
    }

    setJoiningId(communityId);
    try {
      const res = await fetch(`/api/communities/${communityId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Joined community!");
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === communityId
              ? { ...c, is_member: true, member_count: c.member_count + 1 }
              : c
          )
        );
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to join");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setJoiningId(null);
    }
  };

  const handleDeleteCommunity = async (communityId: string, name: string) => {
    if (
      !confirm(
        `Permanently delete "${name}"? All messages and memberships will be removed.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/communities/${communityId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Community deleted");
        setCommunities((prev) => prev.filter((c) => c.id !== communityId));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to delete community");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const activeDestName =
    selectedDestinationId === "all"
      ? null
      : destinations.find((d) => d.id === selectedDestinationId)?.name || null;

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
            marginBottom: 28,
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
              Verified Travel Hubs
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
              Travel Communities
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Connect with verified travellers exploring the same heritage destination and launch group trips together.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/groups"
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
              }}
            >
              <Compass size={14} style={{ color: "#B99A65" }} />
              Travel Groups
            </Link>

            <button
              onClick={() => setCreateModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
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
              }}
            >
              <Plus size={15} />
              Create Community
            </button>
          </div>
        </div>

        {/* Search & Destination Filter Bar */}
        <div
          style={{
            ...panelStyle,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            />
            <input
              id="communities-search"
              aria-label="Search communities by name"
              placeholder="Search communities by name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: 44,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                color: "var(--text)",
                padding: "0 14px 0 42px",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          {/* Destination Filter Pills */}
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 2,
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setSelectedDestinationId("all")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                fontFamily: "inherit",
                fontSize: "0.8rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                background: selectedDestinationId === "all" ? "#fff" : "var(--hover)",
                color: selectedDestinationId === "all" ? "#0b0f12" : "var(--soft)",
                border:
                  selectedDestinationId === "all"
                    ? "1px solid #fff"
                    : "1px solid var(--line)",
              }}
            >
              All Destinations
            </button>

            {destinations.map((d) => {
              const isActive = selectedDestinationId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDestinationId(d.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 999,
                    fontFamily: "inherit",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                    background: isActive ? "#fff" : "var(--hover)",
                    color: isActive ? "#0b0f12" : "var(--soft)",
                    border: isActive ? "1px solid #fff" : "1px solid var(--line)",
                  }}
                >
                  <MapPin size={12} style={{ color: isActive ? "#0b0f12" : "#B99A65" }} />
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Community Cards Grid */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: 16,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  ...panelStyle,
                  height: 170,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div
            style={{
              ...panelStyle,
              padding: "56px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(0, 201, 167, 0.1)",
                border: "1px solid rgba(0, 201, 167, 0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00C9A7",
                marginBottom: 16,
              }}
            >
              <Users size={26} />
            </div>

            <h2
              style={{
                fontFamily: "inherit",
                fontSize: "1.15rem",
                fontWeight: 500,
                margin: "0 0 8px 0",
                color: "var(--text)",
              }}
            >
              {activeDestName
                ? `No communities in ${activeDestName} yet`
                : searchQuery.trim()
                ? "No matching communities found"
                : "No communities yet"}
            </h2>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "0.875rem",
                maxWidth: 420,
                margin: "0 0 22px 0",
                lineHeight: 1.55,
              }}
            >
              Start the first destination room to share local tips, ask questions, and organize live
              group trips with fellow verified travellers.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {(searchQuery.trim() || selectedDestinationId !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedDestinationId("all");
                  }}
                  style={{
                    height: 38,
                    padding: "0 18px",
                    borderRadius: 999,
                    background: "var(--hover)",
                    border: "1px solid var(--line)",
                    color: "var(--soft)",
                    fontFamily: "inherit",
                    fontSize: "0.84rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Clear Filters
                </button>
              )}

              <button
                onClick={() => setCreateModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  height: 38,
                  padding: "0 20px",
                  borderRadius: 999,
                  background: "#fff",
                  border: "none",
                  color: "#0b0f12",
                  fontFamily: "inherit",
                  fontSize: "0.84rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Plus size={15} />
                {activeDestName ? `Create ${activeDestName} Community` : "Create Community"}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: 16,
            }}
          >
            {communities.map((c) => (
              <div
                key={c.id}
                style={{
                  ...panelStyle,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                  borderColor: c.is_member ? "rgba(0, 201, 167, 0.35)" : "var(--line)",
                  background: c.is_member
                    ? "linear-gradient(145deg, rgba(0, 201, 167, 0.08) 0%, rgba(14, 19, 23, 0.9) 100%)"
                    : "var(--panel)",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "var(--hover)",
                        border: "1px solid var(--line)",
                        color: "var(--soft)",
                      }}
                    >
                      <MapPin size={11} style={{ color: "#B99A65" }} />
                      {c.destinations?.name || "India"}
                    </span>

                    {c.is_owner && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: "rgba(185, 154, 101, 0.14)",
                          border: "1px solid rgba(185, 154, 101, 0.35)",
                          color: "#B99A65",
                        }}
                      >
                        Owner
                      </span>
                    )}

                    {c.is_member && !c.is_owner && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: "rgba(0, 201, 167, 0.12)",
                          border: "1px solid rgba(0, 201, 167, 0.35)",
                          color: "#00C9A7",
                        }}
                      >
                        Member
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontFamily: "inherit",
                      fontSize: "1.075rem",
                      fontWeight: 500,
                      lineHeight: 1.3,
                      margin: 0,
                      color: "var(--text)",
                    }}
                  >
                    {c.name}
                  </h3>

                  {c.description && (
                    <p
                      style={{
                        fontSize: "0.84rem",
                        color: "var(--muted)",
                        marginTop: 8,
                        marginBottom: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {c.description}
                    </p>
                  )}
                </div>

                {/* Footer bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    paddingTop: 12,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.78rem",
                      color: "var(--muted)",
                      minWidth: 0,
                    }}
                  >
                    <Users size={13} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap" }}>
                      {c.member_count} {c.member_count === 1 ? "member" : "members"}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      · {c.profiles?.display_name || "Traveller"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {c.is_owner && (
                      <button
                        onClick={() => handleDeleteCommunity(c.id, c.name)}
                        aria-label={`Delete ${c.name}`}
                        title="Delete community"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "rgba(220, 38, 38, 0.12)",
                          border: "1px solid rgba(220, 38, 38, 0.35)",
                          color: "#fca5a5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}/communities/${c.id}`);
                        toast.success("Community invite link copied!");
                      }}
                      aria-label="Copy invite link"
                      title="Copy invite link"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "var(--hover)",
                        border: "1px solid var(--line)",
                        color: "var(--soft)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Share2 size={13} />
                    </button>

                  {c.is_member ? (
                    <Link
                      href={`/communities/${c.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 34,
                        padding: "0 14px",
                        borderRadius: 999,
                        background: "#fff",
                        color: "#0b0f12",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      <MessageCircle size={13} /> Open Chat
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleJoin(c.id)}
                      disabled={joiningId === c.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 34,
                        padding: "0 14px",
                        borderRadius: 999,
                        background: "var(--hover)",
                        border: "1px solid var(--line)",
                        color: "var(--text)",
                        fontFamily: "inherit",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        cursor: joiningId === c.id ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {joiningId === c.id ? (
                        "Joining…"
                      ) : (
                        <>
                          Join <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal
        destinations={destinations}
        profile={profile}
        isOpen={createModalOpen}
        defaultDestinationId={selectedDestinationId !== "all" ? selectedDestinationId : undefined}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => fetchCommunities()}
      />
    </div>
  );
}
