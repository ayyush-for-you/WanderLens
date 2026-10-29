/**
 * WanderLens — central configuration constants.
 * Change values here; they take effect everywhere without code changes elsewhere.
 */

// ─── Feature 3: Recommendation ranking ─────────────────────────────────────

/** Bayesian confidence smoothing constant (number of "virtual" ratings added) */
export const RANKING_K = 5;

/** Activity penalty weight in the score formula */
export const RANKING_W = 0.5;

/** Minimum average rating for a place to be eligible as a hidden gem */
export const MIN_AVG_RATING = 3.8;

/** Minimum number of ratings for eligibility */
export const MIN_N_RATINGS = 3;

/** Maximum activity_norm for a place to be eligible (percentile, 0–1) */
export const MAX_ACTIVITY_NORM = 0.5;

/** Number of days to look back for activity counts */
export const ACTIVITY_WINDOW_DAYS = 30;

// ─── Feature 1B: SOS ────────────────────────────────────────────────────────

/** Radius in metres to search for nearby SOS recipients */
export const SOS_RADIUS_METRES = 2000;

/** Maximum SOS alerts a user may send per rolling hour */
export const SOS_RATE_LIMIT_PER_HOUR = 3;

/** Coarse location precision — round to this many metres (≈100 m) */
export const SOS_COARSE_PRECISION_METRES = 100;

/** How many minutes a user's opt-in presence record lives */
export const PRESENCE_TTL_MINUTES = 30;

// ─── Feature 1A: Group live location ───────────────────────────────────────

/** Minimum seconds between location updates per member */
export const GROUP_LOCATION_UPDATE_INTERVAL_SECONDS = 10;

/** Hours after trip end before group location rows are purged */
export const GROUP_LOCATION_PURGE_HOURS = 24;

// ─── Feature 5: Chat ───────────────────────────────────────────────────────

/** Max chat messages per user per minute */
export const CHAT_RATE_LIMIT_PER_MINUTE = 20;

// ─── Feature 2: Monument scan ──────────────────────────────────────────────

/** CLIP embedding vector dimension */
export const EMBEDDING_DIM = 512;

/** Minimum cosine similarity to accept a monument match as confident */
export const SCAN_CONFIDENCE_THRESHOLD = 0.75;

/** GPS prior boost radius in metres */
export const SCAN_GPS_BOOST_RADIUS_METRES = 5000;

/** GPS proximity score boost added to cosine similarity */
export const SCAN_GPS_BOOST = 0.05;

// ─── Image upload ──────────────────────────────────────────────────────────

/** Maximum allowed upload size per image in bytes (5 MB) */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types for image uploads */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Max photos per post */
export const MAX_POST_PHOTOS = 4;

// ─── Misc ──────────────────────────────────────────────────────────────────

/** Max caption length for a post (characters) */
export const MAX_CAPTION_LENGTH = 500;
