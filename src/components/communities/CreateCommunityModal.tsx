"use client";

import { useState } from "react";
import { Users, X, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { Destination, Profile } from "@/types/database";

interface CreateCommunityModalProps {
  destinations: Destination[];
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCommunityModal({
  destinations,
  profile,
  isOpen,
  onClose,
  onCreated,
}: CreateCommunityModalProps) {
  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState(destinations[0]?.id || "");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination_id: destinationId,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create community");
      }

      toast.success("Community created!");
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
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="card animate-fade-in-scale"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 24,
          position: "relative",
          background: "var(--bg-card)",
          border: "1px solid rgba(168,85,247,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Users size={18} />
            </div>
            <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              Create Community
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm btn-icon" style={{ borderRadius: "50%" }}>
            <X size={16} />
          </button>
        </div>

        {/* Verification banner */}
        {profile && !profile.is_verified && (
          <div className="alert-box alert-box-warning" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            <p style={{ fontSize: "0.8rem" }}>
              Verify your email to create or join travel communities.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="label">Community Name *</label>
            <input
              className="input"
              placeholder="e.g. Delhi Heritage Explorers, Jaipur Weekend Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Destination *</label>
            <select
              className="input"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              required
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.region})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Description & Purpose</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Share travel tips, coordinate weekend monument visits, plan routes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button
              type="submit"
              disabled={isSubmitting || !profile?.is_verified}
              className="btn btn-primary"
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                boxShadow: "0 4px 16px rgba(168,85,247,0.3)",
              }}
            >
              {isSubmitting ? "Creating…" : <><Check size={16} /> Create Community</>}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

