"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  MessageCircle,
  MapPin,
  CheckCircle,
  Shield,
  UserCheck,
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

  const fetchCommunities = async () => {
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
  };

  useEffect(() => {
    fetchCommunities();
  }, [selectedDestinationId, searchQuery]);

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

  return (
    <div className="content-container" style={{ paddingTop: 16, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <span
            className="badge"
            style={{
              background: "rgba(168,85,247,0.15)",
              color: "#c084fc",
              border: "1px solid rgba(168,85,247,0.3)",
              marginBottom: 6,
            }}
          >
            Verified Travel Hubs
          </span>
          <h1 className="font-display" style={{ fontSize: "1.7rem", fontWeight: 700 }}>
            Travel Communities
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 2 }}>
            Connect with travellers visiting the same heritage destination.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary btn-sm"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 16px rgba(168,85,247,0.3)",
          }}
        >
          <Plus size={15} /> Create
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            className="input"
            placeholder="Search communities by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
        </div>

        {/* Destination Pills */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          <button
            onClick={() => setSelectedDestinationId("all")}
            className={`chip ${selectedDestinationId === "all" ? "active" : ""}`}
            style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
          >
            All Destinations
          </button>
          {destinations.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDestinationId(d.id)}
              className={`chip ${selectedDestinationId === d.id ? "active" : ""}`}
              style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
            >
              📍 {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Community Cards List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton" style={{ height: 110, borderRadius: 14 }} />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="card" style={{ padding: "48px 20px", textAlign: "center" }}>
          <Users size={36} style={{ color: "#a855f7", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>
            No communities found
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: 300, margin: "0 auto 16px" }}>
            Create the first community for this destination to coordinate trips and share tips!
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            Create Community
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {communities.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                border: c.is_member ? "1px solid rgba(168,85,247,0.3)" : "1px solid var(--border)",
                background: c.is_member ? "rgba(168,85,247,0.04)" : "var(--bg-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span className="badge badge-teal" style={{ fontSize: "0.7rem" }}>
                      📍 {c.destinations?.name || "India"}
                    </span>
                    {c.is_owner && <span className="badge badge-gold" style={{ fontSize: "0.7rem" }}>Owner</span>}
                    {c.is_member && !c.is_owner && (
                      <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>
                        Member
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.3 }}>
                    {c.name}
                  </h3>
                  {c.description && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.45 }}>
                      {c.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 8,
                  borderTop: "1px solid var(--border-soft)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <Users size={14} />
                  <span>{c.member_count} {c.member_count === 1 ? "member" : "members"}</span>
                  <span>· Created by {c.profiles?.display_name || "Traveller"}</span>
                </div>

                {c.is_member ? (
                  <Link href={`/communities/${c.id}`} style={{ textDecoration: "none" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{
                        background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MessageCircle size={14} /> Open Chat
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleJoin(c.id)}
                    disabled={joiningId === c.id}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "6px 14px" }}
                  >
                    {joiningId === c.id ? "Joining…" : "Join Community"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      <CreateCommunityModal
        destinations={destinations}
        profile={profile}
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => fetchCommunities()}
      />
    </div>
  );
}

