/**
 * WanderLens — Placeholder image URLs for the new design system (Phase 1–3).
 *
 * All URLs are TEMPORARY CloudFront placeholders.
 * Swap them for your own heritage photography in /public when ready.
 * This is the single source of truth — change here and every component updates.
 */

/** Full-viewport hero background image (landing page). */
export const HERO_IMAGE =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_144652_9eaf1d6a-3e8d-4460-bd5b-0ec7221685a0.png";

/**
 * Discover dropdown panel — right-side crossfade preview images.
 * Index maps to the four rows in order:
 *   0 → Monument Scanner
 *   1 → Hidden Gems
 *   2 → Community Hubs
 *   3 → Heritage Map
 */
export const DISCOVER_IMAGES = [
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051509_384c49d8-b37c-49a7-9180-a06ad914ec24.png",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051509_bf51abc3-090e-459f-8066-8f0cdd0c36b9.png",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051509_c4fa86ad-842a-41c9-8cff-a70068ac1aa3.png",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051511_ab19ff38-a140-442d-b2e7-82e3431bf3b6.png",
] as const;

/**
 * Travel Modes dropdown panel — photo card backgrounds.
 * Plain <img> tags; no next/image remotePatterns configuration needed.
 */
export const MODE_IMAGES = {
  solo: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051510_3d88d3aa-ac8a-4e80-b70b-0da5523138cf.png",
  group:
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051510_400ed870-8ffb-4030-b267-2b003780a5e3.png",
} as const;

