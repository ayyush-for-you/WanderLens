"use client";

import { useState, useEffect } from "react";
import { X, Users, AlertCircle, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Destination } from "@/types/database";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: any) => void;
  initialCommunityId?: string;
  initialDestinationId?: string;
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

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
  initialCommunityId,
  initialDestinationId,
  initialDestinations = [],
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState(
    initialDestinationId || initialDestinations[0]?.id || ""
  );
  const [customDestination, setCustomDestination] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);
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
    if (initialDestinations.length > 0) {
      setDestinations(initialDestinations);
      if (!destinationId) {
        setDestinationId(initialDestinationId || initialDestinations[0].id);
      }
      return;
    }

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
            setDestinationId(initialDestinationId || data[0].id);
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
  }, [isOpen, initialDestinationId, destinationId, initialDestinations]);

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
        backgroundColor: "rgba(6, 10, 12, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--panel)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: 24,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 70px rgba(0, 0, 0, 0.65)",
          color: "var(--text)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(0, 201, 167, 0.12)",
                border: "1px solid rgba(0, 201, 167, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00C9A7",
              }}
            >
              <Users size={19} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "inherit",
                  fontSize: "1.125rem",
                  fontWeight: 500,
                  margin: 0,
                  color: "var(--text)",
                }}
              >
                Create Travel Group
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "2px 0 0" }}>
                Live location sharing &amp; group safety alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "var(--hover)",
              border: "1px solid var(--line)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--soft)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="modal-group-name" style={labelStyle}>Group Name *</label>
            <input
              id="modal-group-name"
              name="name"
              type="text"
              placeholder="e.g. Amber Fort Sunset Squad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="modal-group-destination" style={labelStyle}>Destination *</label>
            <select
              id="modal-group-destination"
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
            {destinationsError ? (
              <p style={{ fontSize: "0.75rem", color: "#fca5a5", margin: "6px 0 0" }}>
                {destinationsError}
              </p>
            ) : destinations.length === 0 && !destinationsLoading ? (
              <p style={{ fontSize: "0.75rem", color: "#B99A65", margin: "6px 0 0" }}>
                No destinations loaded yet. Make sure Supabase env vars are configured in .env.local.
              </p>
            ) : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="modal-group-starts-at" style={labelStyle}>Trip Starts *</label>
              <input
                id="modal-group-starts-at"
                name="starts_at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                style={{ ...inputStyle, fontSize: "0.8rem" }}
              />
            </div>
            <div>
              <label htmlFor="modal-group-ends-at" style={labelStyle}>Trip Ends *</label>
              <input
                id="modal-group-ends-at"
                name="ends_at"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                style={{ ...inputStyle, fontSize: "0.8rem" }}
              />
            </div>
          </div>

          {/* Privacy Guarantee callout */}
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
              <strong>Bounded Privacy:</strong> Location sharing is strictly opt-in and visible
              only to accepted members during the active trip window. Records automatically purge
              after the trip ends.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 999,
                background: "var(--hover)",
                border: "1px solid var(--line)",
                color: "var(--soft)",
                fontFamily: "inherit",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                height: 40,
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
              {loading ? "Creating Group…" : "Create Travel Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
