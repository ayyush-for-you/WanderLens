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

/* ─── Shared style tokens ─────────────────────────────────────────── */
const panelStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  color: "var(--text)",
  padding: "7px 12px",
  fontSize: "0.8rem",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
};

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
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="animate-fade-in-scale"
        style={{
          ...panelStyle,
          width: "100%",
          maxWidth: 580,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 0,
          borderRadius: 16,
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(11,16,19,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            padding: "16px 20px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "capitalize",
                color: "#00C9A7",
                border: "1px solid rgba(0,201,167,0.3)",
                borderRadius: 999,
                padding: "2px 9px",
                marginBottom: 4,
              }}
            >
              {place?.category || "Place"}
            </span>
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 500,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              {place?.name || "Loading…"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              background: "var(--hover)",
              border: "1px solid var(--line)",
              borderRadius: "50%",
              color: "var(--soft)",
              cursor: "pointer",
            }}
          >
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
                border: "2px solid var(--line)",
                borderTopColor: "#00C9A7",
                borderRadius: "50%",
              }}
            />
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            {/* Description & Rating Banner */}
            <div
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "16px",
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  color: "var(--soft)",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                {place?.description || "No description provided."}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTop: "1px solid var(--line)",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Star size={18} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                    {Number(place?.avg_rating || 0).toFixed(1)}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    ({place?.n_ratings || 0} traveller ratings)
                  </span>
                </div>

                <button
                  onClick={() => setCreatePostOpen(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#fff",
                    color: "#0b0f12",
                    border: "none",
                    borderRadius: 999,
                    padding: "7px 14px",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Add Review
                </button>
              </div>
            </div>

            {/* Posts & Reviews Feed */}
            <div style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--muted)",
                  marginBottom: 14,
                }}
              >
                Traveller Stories &amp; Photos ({posts.length})
              </h3>

              {posts.length === 0 ? (
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: "32px 16px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: 12 }}>
                    Be the first traveller to share a photo and review of {place?.name}!
                  </p>
                  <button
                    onClick={() => setCreatePostOpen(true)}
                    style={{
                      background: "#00C9A7",
                      color: "#0b0f12",
                      border: "none",
                      borderRadius: 999,
                      padding: "7px 16px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Write First Review
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {posts.map((post: any) => (
                    <div
                      key={post.id}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      {/* Post Author Bar */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #B99A65, #E8C97A)",
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
                            <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)" }}>
                              {post.profiles?.display_name || "Traveller"}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Star Rating Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Star size={13} fill="#fbbf24" color="#fbbf24" />
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#B99A65" }}>
                            {post.rating}.0
                          </span>
                        </div>
                      </div>

                      {/* Post Caption */}
                      {post.caption && (
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--soft)",
                            lineHeight: 1.5,
                            marginBottom: 10,
                          }}
                        >
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
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
                          borderTop: "1px solid var(--line)",
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
                              color: post.is_liked_by_me ? "#f87171" : "var(--muted)",
                              fontSize: "0.8rem",
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
                              color: "var(--muted)",
                              fontSize: "0.8rem",
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
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                              title="Delete my post"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => setReportingPostId(post.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--muted)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
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
                            borderTop: "1px solid var(--line)",
                          }}
                        >
                          <div
                            style={{
                              maxHeight: 180,
                              overflowY: "auto",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              marginBottom: 10,
                            }}
                          >
                            {commentsLoading ? (
                              <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                                Loading comments…
                              </p>
                            ) : comments.length === 0 ? (
                              <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                                No comments yet. Start the conversation!
                              </p>
                            ) : (
                              comments.map((c) => (
                                <div
                                  key={c.id}
                                  style={{
                                    fontSize: "0.8rem",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid var(--line)",
                                    padding: "6px 10px",
                                    borderRadius: 8,
                                  }}
                                >
                                  <span style={{ fontWeight: 600, color: "#00C9A7" }}>
                                    {c.profiles?.display_name || "Traveller"}:{" "}
                                  </span>
                                  <span style={{ color: "var(--soft)" }}>{c.body}</span>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Post comment input */}
                          <form onSubmit={handleCommentSubmit} style={{ display: "flex", gap: 6 }}>
                            <input
                              placeholder="Write a comment..."
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              style={inputStyle}
                            />
                            <button
                              type="submit"
                              disabled={!commentInput.trim()}
                              style={{
                                background: "#00C9A7",
                                color: "#0b0f12",
                                border: "none",
                                borderRadius: 999,
                                padding: "0 14px",
                                cursor: commentInput.trim() ? "pointer" : "not-allowed",
                                opacity: commentInput.trim() ? 1 : 0.5,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
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
            <div
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                maxWidth: 380,
                width: "100%",
                padding: 20,
              }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>
                Report Post
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 12 }}>
                Help keep WanderLens authentic and respectful. Please describe the issue.
              </p>
              <textarea
                rows={3}
                placeholder="Inappropriate content, spam, incorrect info..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                maxLength={500}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  marginBottom: 12,
                  padding: "10px 12px",
                  fontSize: "0.875rem",
                  borderRadius: 10,
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={submitReport}
                  disabled={reportSubmitting || !reportReason.trim()}
                  style={{
                    flex: 1,
                    background: "var(--danger)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 999,
                    padding: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: reportSubmitting || !reportReason.trim() ? "not-allowed" : "pointer",
                    opacity: reportSubmitting || !reportReason.trim() ? 0.6 : 1,
                  }}
                >
                  {reportSubmitting ? "Submitting…" : "Submit Report"}
                </button>
                <button
                  onClick={() => {
                    setReportingPostId(null);
                    setReportReason("");
                  }}
                  style={{
                    background: "var(--hover)",
                    border: "1px solid var(--line)",
                    borderRadius: 999,
                    color: "var(--soft)",
                    padding: "8px 16px",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
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
