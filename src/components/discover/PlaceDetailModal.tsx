"use client";

import { useState, useEffect } from "react";
import {
  X,
  Star,
  MapPin,
  Heart,
  MessageCircle,
  Flag,
  Share2,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Profile } from "@/types/database";
import CreatePostModal from "./CreatePostModal";

interface PlaceDetailModalProps {
  placeId: string;
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaceDetailModal({
  placeId,
  profile,
  isOpen,
  onClose,
}: PlaceDetailModalProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Active comment drawer for a specific post
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  // Report modal state
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const fetchPlaceDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/places/${placeId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error("Failed to load place details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && placeId) {
      fetchPlaceDetails();
    }
  }, [isOpen, placeId]);

  if (!isOpen) return null;

  // Toggle Like on a Post
  const handleLike = async (postId: string) => {
    if (!profile) {
      toast.error("Sign in to like posts");
      return;
    }
    if (!profile.is_verified) {
      toast.error("Verify your email to like posts");
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          posts: prev.posts.map((p: any) =>
            p.id === postId
              ? { ...p, is_liked_by_me: json.is_liked }
              : p
          ),
        }));
      }
    } catch {
      toast.error("Could not update like");
    }
  };

  // Load comments for a post
  const openComments = async (postId: string) => {
    setActiveCommentsPostId(postId);
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const json = await res.json();
        setComments(json.comments || []);
      }
    } catch {
      toast.error("Could not load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  // Submit comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeCommentsPostId) return;

    if (!profile?.is_verified) {
      toast.error("Verify your email to comment");
      return;
    }

    try {
      const res = await fetch(`/api/posts/${activeCommentsPostId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentInput.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        setComments((prev) => [...prev, json.comment]);
        setCommentInput("");
        toast.success("Comment added");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to post comment");
      }
    } catch {
      toast.error("Comment submission failed");
    }
  };

  // Submit moderation report
  const submitReport = async () => {
    if (!reportingPostId || !reportReason.trim()) return;
    setReportSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "post",
          target_id: reportingPostId,
          reason: reportReason.trim(),
        }),
      });
      if (res.ok) {
        toast.success("Report submitted to moderators");
        setReportingPostId(null);
        setReportReason("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Report failed");
      }
    } catch {
      toast.error("Could not submit report");
    } finally {
      setReportSubmitting(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post deleted");
        setData((prev: any) => ({
          ...prev,
          posts: prev.posts.filter((p: any) => p.id !== postId),
        }));
      }
    } catch {
      toast.error("Could not delete post");
    }
  };

  const place = data?.place;
  const posts = data?.posts || [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(6px)",
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
          maxWidth: 580,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 0,
          background: "var(--bg-base)",
          border: "1px solid var(--border)",
          borderRadius: 16,
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(15,14,13,0.92)",
            backdropFilter: "blur(10px)",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-soft)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <div>
            <span className="badge badge-teal" style={{ marginBottom: 4 }}>
              {place?.category || "Place"}
            </span>
            <h2 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              {place?.name || "Loading..."}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm btn-icon">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <span
              className="animate-spin"
              style={{
                display: "inline-block",
                width: 28,
                height: 28,
                border: "2px solid rgba(45,212,191,0.2)",
                borderTopColor: "var(--accent-teal)",
                borderRadius: "50%",
              }}
            />
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            {/* Description & Rating Banner */}
            <div
              className="card"
              style={{
                padding: "16px",
                marginBottom: 20,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 14 }}>
                {place?.description || "No description provided."}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTop: "1px solid var(--border-soft)",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Star size={18} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>
                    {Number(place?.avg_rating || 0).toFixed(1)}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    ({place?.n_ratings || 0} traveller ratings)
                  </span>
                </div>

                <button
                  onClick={() => setCreatePostOpen(true)}
                  className="btn btn-primary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Plus size={14} /> Add Review
                </button>
              </div>
            </div>

            {/* Posts & Reviews Feed */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 14 }}>
                Traveller Stories & Photos ({posts.length})
              </h3>

              {posts.length === 0 ? (
                <div className="card" style={{ padding: "32px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 10 }}>
                    Be the first traveller to share a photo and review of {place?.name}!
                  </p>
                  <button onClick={() => setCreatePostOpen(true)} className="btn btn-teal btn-sm">
                    Write First Review
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {posts.map((post: any) => (
                    <div
                      key={post.id}
                      className="card"
                      style={{ padding: 16, background: "rgba(255,255,255,0.015)" }}
                    >
                      {/* Post Author Bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "var(--gradient-gold)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              color: "#1a0800",
                            }}
                          >
                            {post.profiles?.display_name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                              {post.profiles?.display_name || "Traveller"}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Star Rating Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Star size={13} fill="#fbbf24" color="#fbbf24" />
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-gold)" }}>
                            {post.rating}.0
                          </span>
                        </div>
                      </div>

                      {/* Post Caption */}
                      {post.caption && (
                        <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 10 }}>
                          {post.caption}
                        </p>
                      )}

                      {/* Post Images Grid */}
                      {post.post_images && post.post_images.length > 0 && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: post.post_images.length === 1 ? "1fr" : "1fr 1fr",
                            gap: 6,
                            marginBottom: 12,
                            borderRadius: 10,
                            overflow: "hidden",
                          }}
                        >
                          {post.post_images.map((img: any) => (
                            <div key={img.id} style={{ maxHeight: 180, overflow: "hidden" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=80`}
                                alt="Traveller photo"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Post Interactions Footer */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 8,
                          borderTop: "1px solid var(--border-soft)",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div style={{ display: "flex", gap: 14 }}>
                          <button
                            onClick={() => handleLike(post.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              color: post.is_liked_by_me ? "#f87171" : "var(--text-muted)",
                            }}
                          >
                            <Heart size={15} fill={post.is_liked_by_me ? "#f87171" : "none"} />
                            <span>{post.is_liked_by_me ? "Liked" : "Like"}</span>
                          </button>

                          <button
                            onClick={() => openComments(post.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              color: "var(--text-muted)",
                            }}
                          >
                            <MessageCircle size={15} />
                            <span>Comments ({post.comments_count || 0})</span>
                          </button>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          {profile?.id === post.user_id && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                              title="Delete my post"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => setReportingPostId(post.id)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                            title="Report post"
                          >
                            <Flag size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Comments Drawer (if expanded) */}
                      {activeCommentsPostId === post.id && (
                        <div
                          className="animate-fade-in"
                          style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: "1px solid var(--border)",
                          }}
                        >
                          <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                            {commentsLoading ? (
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Loading comments…</p>
                            ) : comments.length === 0 ? (
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No comments yet. Start the conversation!</p>
                            ) : (
                              comments.map((c) => (
                                <div key={c.id} style={{ fontSize: "0.8rem", background: "rgba(255,255,255,0.02)", padding: "6px 10px", borderRadius: 6 }}>
                                  <span style={{ fontWeight: 600, color: "var(--accent-teal)" }}>
                                    {c.profiles?.display_name || "Traveller"}:{" "}
                                  </span>
                                  <span style={{ color: "var(--text-secondary)" }}>{c.body}</span>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Post comment input */}
                          <form onSubmit={handleCommentSubmit} style={{ display: "flex", gap: 6 }}>
                            <input
                              className="input"
                              placeholder="Write a comment..."
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                            />
                            <button type="submit" className="btn btn-teal btn-sm" disabled={!commentInput.trim()}>
                              <Send size={13} />
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Reason Modal Overlay */}
        {reportingPostId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 110,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div className="card" style={{ maxWidth: 380, width: "100%", padding: 20 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>Report Post</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>
                Help keep WanderLens authentic and respectful. Please describe the issue.
              </p>
              <textarea
                className="input"
                rows={3}
                placeholder="Inappropriate content, spam, incorrect info..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                maxLength={500}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={submitReport}
                  disabled={reportSubmitting || !reportReason.trim()}
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1 }}
                >
                  {reportSubmitting ? "Submitting…" : "Submit Report"}
                </button>
                <button
                  onClick={() => {
                    setReportingPostId(null);
                    setReportReason("");
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          placeId={placeId}
          placeName={place?.name || "Place"}
          profile={profile}
          isOpen={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
          onPostCreated={() => {
            fetchPlaceDetails();
          }}
        />
      </div>
    </div>
  );
}

