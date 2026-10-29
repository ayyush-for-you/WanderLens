"use client";

import { useState, useRef } from "react";
import { Star, Upload, X, AlertCircle, Camera, Check } from "lucide-react";
import toast from "react-hot-toast";
import type { Profile } from "@/types/database";

interface CreatePostModalProps {
  placeId: string;
  placeName: string;
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({
  placeId,
  placeName,
  profile,
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 4) {
      toast.error("You can upload up to 4 photos per post.");
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 5MB limit`);
        continue;
      }
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...validPreviews]);
  };

  const removePhoto = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      toast.error("Please log in to share a post");
      return;
    }

    if (!profile.is_verified) {
      toast.error("Please verify your email first to create posts");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("place_id", placeId);
      formData.append("rating", rating.toString());
      formData.append("caption", caption.trim());

      for (const file of selectedFiles) {
        formData.append("images", file);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to publish post");
      }

      toast.success("Travel post published! Place rating updated.");
      onPostCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Could not publish post");
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
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          position: "relative",
          background: "var(--bg-card)",
          border: "1px solid var(--border-gold)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <span className="badge badge-gold" style={{ marginBottom: 4 }}>
              Add Review & Post
            </span>
            <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {placeName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm btn-icon"
            style={{ borderRadius: "50%" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Unverified notice */}
        {profile && !profile.is_verified && (
          <div className="alert-box alert-box-warning" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            <p style={{ fontSize: "0.8rem" }}>
              Your email is not verified yet. Verify via the email link sent to you to publish ratings.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Star Rating Picker */}
          <div>
            <label className="label" style={{ marginBottom: 6 }}>
              Your Rating (1 to 5 stars) *
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    transition: "transform 0.15s",
                    transform: (hoverRating || rating) >= star ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  <Star
                    size={28}
                    fill={(hoverRating || rating) >= star ? "#fbbf24" : "transparent"}
                    color={(hoverRating || rating) >= star ? "#fbbf24" : "var(--text-muted)"}
                  />
                </button>
              ))}
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-gold)", marginLeft: 6 }}>
                {rating}.0 / 5.0
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
              One rating per traveller counts toward the place average (your latest replaces earlier ones).
            </p>
          </div>

          {/* Caption */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label className="label" htmlFor="post-caption">
                Traveller Review & Notes
              </label>
              <span style={{ fontSize: "0.75rem", color: caption.length > 450 ? "#f87171" : "var(--text-muted)" }}>
                {caption.length}/500
              </span>
            </div>
            <textarea
              id="post-caption"
              rows={3}
              className="input"
              placeholder="What makes this place special? Any tips on crowd timing, hidden spots, or food?"
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 500))}
              maxLength={500}
            />
          </div>

          {/* Photos (1-4) */}
          <div>
            <label className="label" style={{ marginBottom: 6 }}>
              Add Photos (optional, up to 4)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {previews.map((src, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    width: 72,
                    height: 72,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Upload preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{
                      position: "absolute",
                      top: 3,
                      right: 3,
                      background: "rgba(0,0,0,0.7)",
                      border: "none",
                      borderRadius: "50%",
                      color: "#fff",
                      padding: 2,
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {previews.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 8,
                    border: "2px dashed var(--border-soft)",
                    background: "rgba(255,255,255,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    gap: 4,
                  }}
                >
                  <Camera size={18} />
                  <span style={{ fontSize: "0.65rem" }}>Add photo</span>
                </button>
              )}
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
              EXIF GPS metadata is automatically stripped on upload for privacy.
            </p>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              type="submit"
              disabled={isSubmitting || !profile?.is_verified}
              className="btn btn-primary"
              style={{ flex: 1, padding: 12 }}
            >
              {isSubmitting ? "Publishing…" : <><Check size={16} /> Publish Review</>}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: 12 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

