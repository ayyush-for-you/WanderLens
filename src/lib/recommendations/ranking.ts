/**
 * WanderLens — Rule-Based Transparent Hidden Gem Ranking Algorithm
 * PRD Feature 3: Single source of truth for recommendation ranking.
 */

import {
  RANKING_K,
  RANKING_W,
  MIN_AVG_RATING,
  MIN_N_RATINGS,
  MAX_ACTIVITY_NORM,
} from "../../config/constants.ts";
import type { PlaceCategory } from "../../types/database.ts";

export interface PlaceRankingInput {
  id: string;
  name: string;
  category: PlaceCategory;
  destination_id: string;
  avg_rating: number;
  n_ratings: number;
  is_seeded?: boolean;
  description?: string | null;
  location?: string | null;
  distance_m?: number | null;
  // 30-day activity components
  posts_30d: number;
  checkins_30d: number;
  likes_30d: number;
  comments_30d: number;
}

export interface RankedPlaceResult {
  id: string;
  name: string;
  category: PlaceCategory;
  destination_id: string;
  avg_rating: number;
  n_ratings: number;
  is_seeded: boolean;
  description: string | null;
  location?: string | null;
  distance_m: number | null;
  activity_raw: number;
  activity_norm: number;
  confidence: number;
  score: number;
  is_hidden_gem: boolean;
  recommendation_reason: string;
}

/**
 * Calculates raw 30-day activity score from community interactions:
 * activity_raw = posts_30d + 2*checkins_30d + likes_30d*0.2 + comments_30d*0.5
 */
export function calculateRawActivity(input: {
  posts_30d: number;
  checkins_30d: number;
  likes_30d: number;
  comments_30d: number;
}): number {
  return (
    input.posts_30d +
    2 * input.checkins_30d +
    input.likes_30d * 0.2 +
    input.comments_30d * 0.5
  );
}

/**
 * Calculates percentile rank (0 to 1) for an array of values.
 * percentile_rank = count(values < x) / (N - 1) if N > 1, else 0.
 */
export function calculatePercentileRanks(values: number[]): number[] {
  const n = values.length;
  if (n <= 1) return values.map(() => 0.0);

  return values.map((val) => {
    let countLesser = 0;
    let countEqual = 0;
    for (let i = 0; i < n; i++) {
      if (values[i] < val) countLesser++;
      else if (values[i] === val) countEqual++;
    }
    // Standard fractional ranking: (lesser + 0.5 * (equal - 1)) / (n - 1)
    const rank = (countLesser + 0.5 * (countEqual - 1)) / (n - 1);
    return Math.max(0, Math.min(1, Math.round(rank * 1000) / 1000));
  });
}

/**
 * Generates transparent explanation for why a place is recommended.
 */
export function generateRecommendationReason(
  avgRating: number,
  nRatings: number,
  posts30d: number,
  activityNorm: number
): string {
  if (activityNorm <= 0.25) {
    return `Highly rated (${avgRating.toFixed(1)}/5) by ${nRatings} travellers, with only ${posts30d} recent post${posts30d === 1 ? "" : "s"} — a quiet local secret.`;
  }
  return `Rated ${avgRating.toFixed(1)} by ${nRatings} travellers with modest visitor activity (${Math.round(activityNorm * 100)}th percentile).`;
}

/**
 * Ranks a list of places within the same destination according to the WanderLens formula.
 *
 * confidence    = n_ratings / (n_ratings + K)
 * score         = (avg_rating / 5) * confidence - W * activity_norm
 * eligibility   = avg_rating >= 3.8 AND n_ratings >= 3 AND activity_norm <= 0.5
 */
export function rankPlaces(
  places: PlaceRankingInput[],
  options?: {
    categoryFilter?: PlaceCategory | "all";
    sortBy?: "hidden_gems" | "top_rated" | "nearest";
  }
): RankedPlaceResult[] {
  if (!places || places.length === 0) return [];

  const category = options?.categoryFilter || "all";
  const sortBy = options?.sortBy || "hidden_gems";

  // Filter by category if specified
  const filtered =
    category === "all"
      ? places
      : places.filter((p) => p.category === category);

  if (filtered.length === 0) return [];

  // Compute raw activities
  const rawActivities = filtered.map((p) =>
    calculateRawActivity({
      posts_30d: p.posts_30d,
      checkins_30d: p.checkins_30d,
      likes_30d: p.likes_30d,
      comments_30d: p.comments_30d,
    })
  );

  // Compute percentile ranks within destination
  const activityNorms = calculatePercentileRanks(rawActivities);

  const results: RankedPlaceResult[] = filtered.map((p, index) => {
    const activity_raw = rawActivities[index];
    const activity_norm = activityNorms[index];
    const confidence = p.n_ratings / (p.n_ratings + RANKING_K);
    const score = (p.avg_rating / 5) * confidence - RANKING_W * activity_norm;

    const is_hidden_gem =
      p.avg_rating >= MIN_AVG_RATING &&
      p.n_ratings >= MIN_N_RATINGS &&
      activity_norm <= MAX_ACTIVITY_NORM;

    const recommendation_reason = generateRecommendationReason(
      p.avg_rating,
      p.n_ratings,
      p.posts_30d,
      activity_norm
    );

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      destination_id: p.destination_id,
      avg_rating: p.avg_rating,
      n_ratings: p.n_ratings,
      is_seeded: p.is_seeded ?? false,
      description: p.description ?? null,
      location: p.location ?? null,
      distance_m: p.distance_m ?? null,
      activity_raw: Math.round(activity_raw * 100) / 100,
      activity_norm,
      confidence: Math.round(confidence * 1000) / 1000,
      score: Math.round(score * 10000) / 10000,
      is_hidden_gem,
      recommendation_reason,
    };
  });

  // Sort based on requested mode
  if (sortBy === "hidden_gems") {
    // Hidden gems first, then sorted descending by formula score
    results.sort((a, b) => {
      if (a.is_hidden_gem && !b.is_hidden_gem) return -1;
      if (!a.is_hidden_gem && b.is_hidden_gem) return 1;
      return b.score - a.score;
    });
  } else if (sortBy === "top_rated") {
    results.sort((a, b) => b.avg_rating - a.avg_rating);
  } else if (sortBy === "nearest") {
    results.sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity));
  }

  return results;
}
