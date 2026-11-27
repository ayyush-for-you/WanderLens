"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Check, AlertCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Destination } from "@/types/database";

interface CreateGroupPageClientProps {
  initialDestinations?: Destination[];
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  color: "var(--text)",
  padding: "10px 14px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  outline: "none",
  colorScheme: "dark",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "var(--soft)",
  marginBottom: 6,
};

export default function CreateGroupPageClient({
  initialDestinations = [],
}: CreateGroupPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get("community_id") || undefined;
  const preselectedDestinationId = searchParams.get("destination_id") || undefined;

  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState(
    preselectedDestinationId || initialDestinations[0]?.id || ""
  );
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations);
  const [customDestination, setCustomDestination] = useState("");
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [communityMembers, setCommunityMembers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default start/end times
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const defaultStart = now.toISOString().slice(0, 16);

    const end = new Date(Date.now() + 6 * 60 * 60 * 1000);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
    const defaultEnd = end.toISOString().slice(0, 16);

    setStartsAt(defaultStart);
    setEndsAt(defaultEnd);
  }, []);

  // Fetch destinations fallback if none provided
  useEffect(() => {
    if (initialDestinations.length > 0) return;
    let isMounted = true;
    const fetchDestinations = async () => {
      setDestinationsLoading(true);
      setDestinationsError(null);
      try {
        const supabase = createClient();
        const { data, error: sbError } = await supabase
          .from("destinations")
          .select("*")
          .order("name");
        if (sbError) throw sbError;
        if (isMounted && data && data.length > 0) {
          setDestinations(data as Destination[]);
          if (!destinationId) {
            setDestinationId(preselectedDestinationId || data[0].id);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch destinations:", err);
        if (isMounted) {
          setDestinationsError(err.message || "Failed to load destinations");
        }
      } finally {
        if (isMounted) {
          setDestinationsLoading(false);
        }
      }
    };
    fetchDestinations();
    return () => {
      isMounted = false;
    };
  }, [preselectedDestinationId, destinationId, initialDestinations]);

  // If created from a community, fetch community members to invite
  useEffect(() => {
    if (!communityId) return;
    const fetchCommunity = async () => {
      try {
        const res = await fetch(`/api/communities/${communityId}`);
        const data = await res.json();
        if (data.community) {
          setName(`${data.community.name} Trip`);
          if (data.community.destination_id) {
            setDestinationId(data.community.destination_id);
          }
        }
        if (data.members) {
          setCommunityMembers(data.members);
          const otherMemberIds = data.members.map((m: any) => m.user_id);
          setSelectedUserIds(otherMemberIds);
        }
      } catch (err) {
        console.error("Failed to fetch community details:", err);
      }
    };
    fetchCommunity();
  }, [communityId]);

  const toggleSelectMember = (uid: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (!destinationId) {
      setError("Please select a destination");
      return;
    }

    const startObj = new Date(startsAt);
    const endObj = new Date(endsAt);

    if (endObj <= startObj) {
      setError("Trip end time must be after start time");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let resolvedDestinationId = destinationId;
      if (destinationId === "__other__") {
        if (!customDestination.trim()) {
          setError("Please enter a custom place name");
          setLoading(false);
          return;
        }
        const destRes = await fetch("/api/destinations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: customDestination.trim() }),
        });
        const destData = await destRes.json();
        if (!destRes.ok || !destData.destination?.id) {
          setError(destData.error || "Failed to save custom destination");
          setLoading(false);
          return;
        }
        resolvedDestinationId = destData.destination.id;
      }

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination_id: resolvedDestinationId,
          starts_at: startObj.toISOString(),
          ends_at: endObj.toISOString(),
          community_id: communityId || null,
          invited_user_ids: selectedUserIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create group");
        setLoading(false);
        return;
      }

      router.push(`/groups/${data.group.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create group");
      setLoading(false);
    }
  };

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
          maxWidth: 640,
          margin: "0 auto",
          padding: "36px 20px 96px",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link
            href={communityId ? `/communities/${communityId}` : "/groups"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.84rem",
              color: "var(--muted)",
              textDecoration: "none",
              marginBottom: 14,
            }}
          >
            <ArrowLeft size={15} /> Back
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#00C9A7",
                background: "rgba(0, 201, 167, 0.1)",
                border: "1px solid rgba(0, 201, 167, 0.3)",
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              <Users size={11} /> Travel Party Setup
            </span>
          </div>

          <h1
            style={{
              fontFamily: "inherit",
              fontSize: "clamp(1.5rem, 3vw, 1.85rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              margin: "0 0 6px 0",
              color: "var(--text)",
            }}
          >
            {communityId ? "Convert Community to Travel Group" : "Create Travel Group"}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            Enable live location sharing and coordinated safety alerts for your trip.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(220, 38, 38, 0.12)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: "0.84rem",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--panel)",
            backdropFilter: "blur(22px) saturate(140%)",
            WebkitBackdropFilter: "blur(22px) saturate(140%)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label htmlFor="new-group-name" style={labelStyle}>Trip / Group Name *</label>
              <input
                id="new-group-name"
                name="name"
                type="text"
                placeholder="e.g. Amber Fort Heritage Tour"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="new-group-destination" style={labelStyle}>Destination *</label>
              <select
                id="new-group-destination"
                name="destination_id"
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                required
                disabled={destinationsLoading}
              >
                <option value="" disabled>
                  {destinationsLoading
                    ? "Loading destinations..."
                    : destinationsError
                    ? "Error loading destinations"
                    : destinations.length === 0
                    ? "No destinations available"
                    : "Select a destination"}
                </option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.region})
                  </option>
                ))}
                <option value="__other__">Other (Enter custom place…)</option>
              </select>
              {destinationId === "__other__" && (
                <input
                  type="text"
                  placeholder="Enter place or city name (e.g. Manali, Hampi, Kyoto)"
                  value={customDestination}
                  onChange={(e) => setCustomDestination(e.target.value)}
                  maxLength={80}
                  required
                  style={{ ...inputStyle, marginTop: 8 }}
                />
              )}
              {destinationsError && (
                <p style={{ fontSize: "0.75rem", color: "#fca5a5", margin: "6px 0 0" }}>
                  {destinationsError}
                </p>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label htmlFor="new-group-starts-at" style={labelStyle}>Trip Window Start *</label>
                <input
                  id="new-group-starts-at"
                  name="starts_at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                  style={{ ...inputStyle, fontSize: "0.8rem" }}
                />
              </div>
              <div>
                <label htmlFor="new-group-ends-at" style={labelStyle}>Trip Window End *</label>
                <input
                  id="new-group-ends-at"
                  name="ends_at"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                  style={{ ...inputStyle, fontSize: "0.8rem" }}
                />
              </div>
            </div>

            {/* Member invite checklist if coming from community */}
            {communityMembers.length > 0 && (
              <div>
                <label style={labelStyle}>
                  Invite Community Members ({selectedUserIds.length} selected)
                </label>
                <div
                  style={{
                    maxHeight: 190,
                    overflowY: "auto",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {communityMembers.map((m) => {
                    const isSelected = selectedUserIds.includes(m.user_id);
                    return (
                      <div
                        key={m.user_id}
                        onClick={() => toggleSelectMember(m.user_id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: isSelected ? "rgba(0, 201, 167, 0.1)" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                          {m.profiles?.display_name || "Member"}
                        </span>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            border: isSelected ? "none" : "1px solid var(--line)",
                            background: isSelected ? "#00C9A7" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#0b1013",
                          }}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div
              style={{
                padding: 12,
                background: "rgba(0, 201, 167, 0.08)",
                border: "1px solid rgba(0, 201, 167, 0.25)",
                borderRadius: 10,
                fontSize: "0.78rem",
                color: "#7ee8d6",
                lineHeight: 1.45,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Shield size={16} style={{ flexShrink: 0, marginTop: 2, color: "#00C9A7" }} />
              <div>
                <strong>Strict Privacy Standard:</strong> Invited members receive an invitation
                they must explicitly accept. Location sharing is never turned on automatically and
                only activates if a member opts in during the active trip window.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Link
                href={communityId ? `/communities/${communityId}` : "/groups"}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 999,
                  background: "var(--hover)",
                  border: "1px solid var(--line)",
                  color: "var(--soft)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  height: 42,
                  borderRadius: 999,
                  background: "#fff",
                  border: "none",
                  color: "#0b0f12",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Creating Group…" : "Launch Travel Group"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
