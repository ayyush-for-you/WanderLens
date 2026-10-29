/**
 * WanderLens — TypeScript types auto-mirroring the Postgres schema.
 * Update this file whenever the schema changes.
 */

export type UserRole = "traveller" | "moderator" | "admin";
export type GroupStatus = "active" | "ended" | "cancelled";
export type GroupMemberStatus = "invited" | "accepted" | "left";
export type ImageKind = "reference" | "historic";
export type AlertType = "need_help" | "regroup" | "custom_message";
export type SosStatus = "active" | "resolved" | "false_alarm";
export type ReportTargetType = "post" | "comment" | "message" | "user";
export type ReportStatus = "open" | "resolved";
export type PlaceCategory =
  | "heritage"
  | "food"
  | "nature"
  | "viewpoint"
  | "market"
  | "culture"
  | "other";

// ─── Profiles ───────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_verified: boolean;
  sos_opt_in: boolean;
  suspended_until: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Destinations ───────────────────────────────────────────────────────────
export interface Destination {
  id: string;
  name: string;
  region: string;
  country: string;
  centre: string; // PostGIS geography point as WKT
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Places ─────────────────────────────────────────────────────────────────
export interface Place {
  id: string;
  destination_id: string;
  name: string;
  category: PlaceCategory;
  location: string; // PostGIS geography
  description: string | null;
  avg_rating: number;
  n_ratings: number;
  is_seeded: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaceActivityDaily {
  place_id: string;
  date: string;
  posts: number;
  checkins: number;
  likes: number;
  comments: number;
}

// ─── Monuments ──────────────────────────────────────────────────────────────
export interface Monument {
  id: string;
  destination_id: string;
  name: string;
  location: string; // PostGIS geography
  built_year: number | null;
  builder: string | null;
  style: string | null;
  history_text: string;
  history_version: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonumentImage {
  id: string;
  monument_id: string;
  storage_path: string;
  kind: ImageKind;
  source_url: string | null;
  license: string | null;
  author_credit: string | null;
  embedding: number[] | null; // vector(512), only for reference images
  created_at: string;
}

export interface MonumentRevision {
  id: string;
  monument_id: string;
  text: string;
  edited_by: string;
  created_at: string;
}

// ─── Scans ──────────────────────────────────────────────────────────────────
export interface Scan {
  id: string;
  user_id: string;
  monument_id: string | null;
  confidence: number | null;
  created_at: string;
}

// ─── Posts ──────────────────────────────────────────────────────────────────
export interface Post {
  id: string;
  user_id: string;
  place_id: string;
  caption: string | null;
  rating: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostImage {
  id: string;
  post_id: string;
  storage_path: string;
  created_at: string;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Communities ────────────────────────────────────────────────────────────
export interface Community {
  id: string;
  destination_id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  community_id: string;
  user_id: string;
  role: "member" | "owner";
  joined_at: string;
}

export interface Message {
  id: string;
  community_id: string;
  user_id: string;
  body: string;
  is_hidden: boolean;
  created_at: string;
}

// ─── Travel Groups ──────────────────────────────────────────────────────────
export interface TravelGroup {
  id: string;
  community_id: string | null;
  owner_id: string;
  destination_id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  status: GroupMemberStatus;
  sharing_on: boolean;
  joined_at: string;
}

export interface GroupLocation {
  group_id: string;
  user_id: string;
  location: string; // PostGIS geography
  updated_at: string;
}

export interface GroupAlert {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string | null;
  type: AlertType;
  body: string | null;
  created_at: string;
}

// ─── SOS ────────────────────────────────────────────────────────────────────
export interface UserPresence {
  user_id: string;
  coarse_location: string; // PostGIS geography, coarse
  expires_at: string;
}

export interface SosAlert {
  id: string;
  sender_id: string;
  coarse_location: string;
  note: string | null;
  status: SosStatus;
  recipient_count: number;
  created_at: string;
  resolved_at: string | null;
}

export interface SosResponse {
  sos_id: string;
  helper_id: string;
  responded_at: string;
}

// ─── Safety ─────────────────────────────────────────────────────────────────
export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  handled_by: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type TableDef<T, R extends GenericRelationship[] = []> = {
  Row: T & Record<string, any>;
  Insert: Partial<T> & Record<string, any>;
  Update: Partial<T> & Record<string, any>;
  Relationships: R;
};

// ─── Supabase Database type (for typed client) ──────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      destinations: TableDef<Destination>;
      places: TableDef<
        Place,
        [
          {
            foreignKeyName: "places_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "destinations";
            referencedColumns: ["id"];
          }
        ]
      >;
      place_activity_daily: TableDef<
        PlaceActivityDaily,
        [
          {
            foreignKeyName: "place_activity_daily_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          }
        ]
      >;
      monuments: TableDef<
        Monument,
        [
          {
            foreignKeyName: "monuments_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "destinations";
            referencedColumns: ["id"];
          }
        ]
      >;
      monument_images: TableDef<
        MonumentImage,
        [
          {
            foreignKeyName: "monument_images_monument_id_fkey";
            columns: ["monument_id"];
            isOneToOne: false;
            referencedRelation: "monuments";
            referencedColumns: ["id"];
          }
        ]
      >;
      monument_revisions: TableDef<MonumentRevision>;
      scans: TableDef<Scan>;
      posts: TableDef<Post>;
      post_images: TableDef<PostImage>;
      post_likes: TableDef<PostLike>;
      comments: TableDef<Comment>;
      communities: TableDef<Community>;
      community_members: TableDef<CommunityMember>;
      messages: TableDef<Message>;
      travel_groups: TableDef<
        TravelGroup,
        [
          {
            foreignKeyName: "travel_groups_destination_id_fkey";
            columns: ["destination_id"];
            isOneToOne: false;
            referencedRelation: "destinations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "travel_groups_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "travel_groups_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          }
        ]
      >;
      group_members: TableDef<
        GroupMember,
        [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "travel_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ]
      >;
      group_locations: TableDef<GroupLocation>;
      group_alerts: TableDef<
        GroupAlert,
        [
          {
            foreignKeyName: "group_alerts_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "travel_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_alerts_from_user_fkey";
            columns: ["from_user"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ]
      >;
      user_presence: TableDef<UserPresence>;
      sos_alerts: TableDef<
        SosAlert,
        [
          {
            foreignKeyName: "sos_alerts_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ]
      >;
      sos_responses: TableDef<
        SosResponse,
        [
          {
            foreignKeyName: "sos_responses_sos_id_fkey";
            columns: ["sos_id"];
            isOneToOne: false;
            referencedRelation: "sos_alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sos_responses_helper_id_fkey";
            columns: ["helper_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ]
      >;
      blocks: TableDef<Block>;
      reports: TableDef<
        Report,
        [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ]
      >;
      audit_log: TableDef<AuditLog>;
    };
    Views: Record<string, never>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, never>;
  };
};
