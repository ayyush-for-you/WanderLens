"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, MapPin, Shield, Check, AlertCircle } from "lucide-react";
import type { Destination } from "@/types/database";

export default function CreateGroupPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get("community_id") || undefined;
  const preselectedDestinationId = searchParams.get("destination_id") || undefined;

  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState(preselectedDestinationId || "");
  const [destinations, setDestinations] = useState<Destination[]>([]);
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

  // Fetch destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await fetch("/api/destinations");
        const data = await res.json();
        if (data.destinations) {
          setDestinations(data.destinations);
          if (!destinationId && data.destinations.length > 0) {
            setDestinationId(preselectedDestinationId || data.destinations[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch destinations:", err);
      }
    };
    fetchDestinations();
  }, [preselectedDestinationId, destinationId]);

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
          // By default, select other members
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
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination_id: destinationId,
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
    <div className="container" style={{ paddingBottom: 80, maxWidth: 640 }}>
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <Link
          href={communityId ? `/communities/${communityId}` : "/groups"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
          {communityId ? "Convert Community to Travel Group" : "Create Travel Group"}
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
          Enable live location sharing and coordinated safety alerts for your trip.
        </p>
      </div>

      {error && (
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
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, background: "#1c1917" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
              Trip / Group Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Amber Fort Heritage Tour"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="input-field"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
              Destination *
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="input-field"
              style={{ width: "100%", background: "#26221f" }}
              required
            >
              <option value="" disabled>Select a destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.region})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                Trip Window Start *
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="input-field"
                style={{ width: "100%", fontSize: "0.8rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                Trip Window End *
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="input-field"
                style={{ width: "100%", fontSize: "0.8rem" }}
              />
            </div>
          </div>

          {/* Member invite checklist if coming from community */}
          {communityMembers.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                Invite Community Members ({selectedUserIds.length} selected):
              </label>
              <div
                style={{
                  maxHeight: 180,
                  overflowY: "auto",
                  background: "#221f1c",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
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
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: isSelected ? "rgba(232, 168, 56, 0.12)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem" }}>
                        {m.profiles?.display_name || "Member"}
                      </span>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: isSelected ? "none" : "1px solid var(--border)",
                          background: isSelected ? "var(--accent-gold)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#1a0800",
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
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 8,
              fontSize: "0.78rem",
              color: "#34d399",
              lineHeight: 1.4,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Strict Privacy Standard:</strong> Invited members receive an invitation they must explicitly accept. Location sharing is never turned on automatically and only activates if a member opts in during the active trip window.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Link
              href={communityId ? `/communities/${communityId}` : "/groups"}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px 0", textAlign: "center", textDecoration: "none" }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 2, padding: "10px 0" }}
            >
              {loading ? "Creating Group..." : "Launch Travel Group"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

