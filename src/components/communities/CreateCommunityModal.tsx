"use client";

import { useState, useEffect } from "react";
import { Users, X, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { Destination, Profile } from "@/types/database";

interface CreateCommunityModalProps {
  destinations: Destination[];
  profile: Profile | null;
  isOpen: boolean;
  defaultDestinationId?: string;
  onClose: () => void;
  onCreated: () => void;
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

export default function CreateCommunityModal({
  destinations,
  profile,
  isOpen,
  defaultDestinationId,
  onClose,
  onCreated,
}: CreateCommunityModalProps) {
  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState(
    defaultDestinationId || destinations[0]?.id || ""
  );
  const [customDestination, setCustomDestination] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDestinationId(defaultDestinationId || destinations[0]?.id || "");
    }
  }, [isOpen, defaultDestinationId, destinations]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      toast.error("Please sign in first");
      return;
    }

    if (!profile.is_verified) {
      toast.error("Verify your email to create a community");
      return;
    }

    if (!name.trim() || name.length < 3) {
      toast.error("Community name must be at least 3 characters");
      return;
    }

    if (!destinationId) {
      toast.error("Please select a destination");
      return;
    }

    setIsSubmitting(true);

    try {
      let resolvedDestinationId = destinationId;
      if (destinationId === "__other__") {
        if (!customDestination.trim()) {
          toast.error("Please enter a custom place name");
          setIsSubmitting(false);
          return;
        }
        const destRes = await fetch("/api/destinations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: customDestination.trim() }),
        });
        const destData = await destRes.json();
        if (!destRes.ok || !destData.destination?.id) {
          throw new Error(destData.error || "Failed to save custom destination");
        }
        resolvedDestinationId = destData.destination.id;
      }

      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination_id: resolvedDestinationId,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create community");
      }

      toast.success("Community created!");
      setName("");
      setDescription("");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create community");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(6, 10, 12, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          padding: 24,
          position: "relative",
          background: "var(--panel)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          boxShadow: "0 30px 70px rgba(0, 0, 0, 0.65)",
          color: "var(--text)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
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
              <Users size={18} />
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
                Create Community
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "2px 0 0" }}>
                Destination chatroom for verified travellers
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

        {/* Verification banner */}
        {profile && !profile.is_verified && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(185, 154, 101, 0.1)",
              border: "1px solid rgba(185, 154, 101, 0.35)",
              color: "#B99A65",
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "0.8rem", margin: 0 }}>
              Verify your email to create or join travel communities.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="community-name-input" style={labelStyle}>
              Community Name *
            </label>
            <input
              id="community-name-input"
              name="name"
              placeholder="e.g. Delhi Heritage Explorers, Jaipur Weekend Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="community-destination-select" style={labelStyle}>
              Destination *
            </label>
            <select
              id="community-destination-select"
              name="destination_id"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {destinations.length === 0 ? (
                <option value="" disabled>
                  No destinations available
                </option>
              ) : null}
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
          </div>

          <div>
            <label htmlFor="community-description-input" style={labelStyle}>
              Description &amp; Purpose
            </label>
            <textarea
              id="community-description-input"
              name="description"
              rows={3}
              placeholder="Share travel tips, coordinate weekend monument visits, plan routes…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              style={{ ...inputStyle, resize: "vertical", minHeight: 84, lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
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
              disabled={isSubmitting || !profile?.is_verified}
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: isSubmitting || !profile?.is_verified ? "not-allowed" : "pointer",
                opacity: isSubmitting || !profile?.is_verified ? 0.55 : 1,
              }}
            >
              {isSubmitting ? (
                "Creating…"
              ) : (
                <>
                  <Check size={15} /> Create Community
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
