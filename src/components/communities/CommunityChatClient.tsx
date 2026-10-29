"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Users,
  MoreVertical,
  Flag,
  UserX,
  ArrowLeft,
  Shield,
  AlertCircle,
  MapPin,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Profile } from "@/types/database";

interface CommunityChatClientProps {
  communityId: string;
  initialCommunity: any;
  initialMessages: any[];
  initialMembers: any[];
  profile: Profile | null;
}

export default function CommunityChatClient({
  communityId,
  initialCommunity,
  initialMessages,
  initialMembers,
  profile,
}: CommunityChatClientProps) {
  const [community, setCommunity] = useState(initialCommunity);
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [members, setMembers] = useState<any[]>(initialMembers);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Members drawer & Report/Block modals
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [selectedUserToBlock, setSelectedUserToBlock] = useState<{ id: string; name: string } | null>(null);

  // Rate limiting tracker
  const [recentSends, setRecentSends] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          // Fetch sender profile if not already included
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, role")
            .eq("id", newMsg.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, profiles: senderProfile },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, supabase]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!profile) {
      toast.error("Sign in to send messages");
      return;
    }

    if (!profile.is_verified) {
      toast.error("Verify your email to participate in community chat");
      return;
    }

    // Client-side rate limit check (20 per minute)
    const now = Date.now();
    const oneMinAgo = now - 60 * 1000;
    const windowSends = recentSends.filter((t) => t > oneMinAgo);

    if (windowSends.length >= 20) {
      toast.error("Rate limit reached: maximum 20 messages per minute.");
      return;
    }

    setRecentSends([...windowSends, now]);
    setIsSending(true);

    try {
      const res = await fetch(`/api/communities/${communityId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: inputText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setInputText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  // Block a user
  const handleBlockUser = async () => {
    if (!selectedUserToBlock) return;
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_id: selectedUserToBlock.id }),
      });

      if (res.ok) {
        toast.success(`Blocked ${selectedUserToBlock.name}. Their messages are now hidden.`);
        // Instantly hide their messages in client
        setMessages((prev) => prev.filter((m) => m.user_id !== selectedUserToBlock.id));
        setSelectedUserToBlock(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to block user");
      }
    } catch {
      toast.error("Block action failed");
    }
  };

  // Report message
  const handleReportMessage = async () => {
    if (!reportingMessageId || !reportReason.trim()) return;
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "message",
          target_id: reportingMessageId,
          reason: reportReason.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Message reported to moderators");
        setReportingMessageId(null);
        setReportReason("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Report failed");
      }
    } catch {
      toast.error("Failed to submit report");
    }
  };

  // Leave community
  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this community?")) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/join`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Left community");
        router.push("/communities");
      } else {
        const err = await res.json();
        toast.error(err.error || "Could not leave");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const isOwner = profile?.id === community?.owner_id;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 120px)",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {/* ── Chatroom Header ─────────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "0 0 14px 14px",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          background: "rgba(20,18,16,0.9)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/communities" className="btn btn-secondary btn-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>
              {community?.name}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              📍 {community?.destinations?.name || "Destination"} · {members.length} members
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isOwner && (
            <Link href={`/groups/new?community_id=${communityId}`}>
              <button
                className="btn btn-primary btn-sm"
                style={{ fontSize: "0.75rem", padding: "6px 10px", gap: 4 }}
                title="Convert this community to a travel group with live location sharing (Phase 5)"
              >
                <Sparkles size={13} /> Group Mode
              </button>
            </Link>
          )}

          <button
            onClick={() => setMembersDrawerOpen(true)}
            className="btn btn-secondary btn-sm btn-icon"
            title="View Members"
          >
            <Users size={16} />
          </button>
        </div>
      </div>

      {/* ── Messages Feed ───────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Welcome Banner */}
        <div
          className="card"
          style={{
            padding: "14px",
            textAlign: "center",
            background: "rgba(168,85,247,0.05)",
            border: "1px dashed rgba(168,85,247,0.25)",
            marginBottom: 8,
          }}
        >
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Welcome to <strong>{community?.name}</strong>! This is an authentic space to coordinate plans, ask for local advice, and connect safely with verified travellers.
          </p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.user_id === profile?.id;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
                gap: 2,
              }}
            >
              {/* Sender label */}
              {!isMe && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-teal)" }}>
                    {msg.profiles?.display_name || "Traveller"}
                  </span>
                  {msg.profiles?.role === "admin" && (
                    <span className="badge badge-gold" style={{ fontSize: "0.6rem", padding: "1px 5px" }}>
                      Admin
                    </span>
                  )}
                  {msg.profiles?.role === "moderator" && (
                    <span className="badge badge-teal" style={{ fontSize: "0.6rem", padding: "1px 5px" }}>
                      Mod
                    </span>
                  )}
                </div>
              )}

              {/* Bubble */}
              <div
                style={{
                  position: "relative",
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: isMe
                    ? "linear-gradient(135deg, #7c3aed, #9333ea)"
                    : "#221f1c",
                  color: isMe ? "#fff" : "var(--text-primary)",
                  border: isMe ? "none" : "1px solid var(--border-soft)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  wordBreak: "break-word",
                  lineHeight: 1.45,
                  fontSize: "0.9rem",
                }}
              >
                {msg.body}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                    marginTop: 4,
                    fontSize: "0.675rem",
                    color: isMe ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
                  }}
                >
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  {!isMe && (
                    <button
                      onClick={() => setReportingMessageId(msg.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        padding: 0,
                        opacity: 0.7,
                      }}
                      title="Report message"
                    >
                      <Flag size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer Bar ────────────────────────────────────────── */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "#181512",
          borderTop: "1px solid var(--border)",
        }}
      >
        <input
          className="input"
          placeholder={
            profile?.is_verified
              ? "Type message to community..."
              : "Verify email to send messages"
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSending || !profile?.is_verified}
          maxLength={2000}
          style={{ flex: 1, minHeight: 42, fontSize: "0.9rem" }}
        />
        <button
          type="submit"
          disabled={isSending || !inputText.trim() || !profile?.is_verified}
          className="btn btn-primary btn-icon"
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          }}
        >
          <Send size={16} />
        </button>
      </form>

      {/* ── Members Drawer Modal ────────────────────────────────── */}
      {membersDrawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              width: "100%",
              maxWidth: 360,
              height: "100%",
              background: "var(--bg-card)",
              borderLeft: "1px solid var(--border)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Community Members</h3>
              <button onClick={() => setMembersDrawerOpen(false)} className="btn btn-secondary btn-sm btn-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {members.map((m) => (
                <div
                  key={m.user_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "var(--gradient-gold)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#1a0800",
                      }}
                    >
                      {m.profiles?.display_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {m.profiles?.display_name || "Traveller"}
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {m.role === "owner" ? "Community Creator" : "Member"}
                      </p>
                    </div>
                  </div>

                  {m.user_id !== profile?.id && (
                    <button
                      onClick={() =>
                        setSelectedUserToBlock({
                          id: m.user_id,
                          name: m.profiles?.display_name || "this user",
                        })
                      }
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                      title="Block user"
                    >
                      <UserX size={12} /> Block
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Leave Community option */}
            {!isOwner && (
              <button
                onClick={handleLeave}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 16, width: "100%", color: "#f87171" }}
              >
                Leave Community
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Block Confirmation Dialog ───────────────────────────── */}
      {selectedUserToBlock && (
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
          <div className="card" style={{ maxWidth: 360, width: "100%", padding: 20 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>
              Block {selectedUserToBlock.name}?
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>
              Blocked users cannot DM or see each other&apos;s messages in shared spaces, and cannot be placed in the same travel group.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleBlockUser} className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                Confirm Block
              </button>
              <button onClick={() => setSelectedUserToBlock(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Message Dialog ───────────────────────────────── */}
      {reportingMessageId && (
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
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>
              Report Message to Moderators
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>
              Please describe why this message violates WanderLens community standards.
            </p>
            <textarea
              className="input"
              rows={3}
              placeholder="Harassment, spam, commercial advertising, unsafe behavior..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              maxLength={500}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleReportMessage}
                disabled={!reportReason.trim()}
                className="btn btn-danger btn-sm"
                style={{ flex: 1 }}
              >
                Submit Report
              </button>
              <button onClick={() => setReportingMessageId(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

