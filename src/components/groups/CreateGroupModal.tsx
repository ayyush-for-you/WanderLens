"use client";

import { useState, useEffect } from "react";
import { X, Calendar, MapPin, Users, AlertCircle, Shield } from "lucide-react";
import type { Destination } from "@/types/database";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: any) => void;
  initialCommunityId?: string;
  initialDestinationId?: string;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
  initialCommunityId,
  initialDestinationId,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState(initialDestinationId || "");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default start/end times (now to +6 hours)
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const defaultStart = now.toISOString().slice(0, 16);

      const end = new Date(Date.now() + 6 * 60 * 60 * 1000);
      end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
      const defaultEnd = end.toISOString().slice(0, 16);

      setStartsAt(defaultStart);
      setEndsAt(defaultEnd);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchDestinations = async () => {
      try {
        const res = await fetch("/api/destinations");
        const data = await res.json();
        if (data.destinations) {
          setDestinations(data.destinations);
          if (!destinationId && data.destinations.length > 0) {
            setDestinationId(initialDestinationId || data.destinations[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch destinations:", err);
      }
    };
    fetchDestinations();
  }, [isOpen, initialDestinationId, destinationId]);

  if (!isOpen) return null;

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
          community_id: initialCommunityId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create group");
        setLoading(false);
        return;
      }

      onGroupCreated(data.group);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#1c1917",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(232, 168, 56, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-gold)",
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Create Travel Group
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                Live location sharing & group safety alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
              Group Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Amber Fort Sunset Squad"
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
                Trip Starts *
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
                Trip Ends *
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

          {/* Privacy Guarantee callout */}
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
              <strong>Bounded Privacy:</strong> Location sharing is strictly opt-in and visible only to accepted members of this group during the active trip window. Records automatically purge after the trip ends.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px 0" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 2, padding: "10px 0" }}
            >
              {loading ? "Creating Group..." : "Create Travel Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

