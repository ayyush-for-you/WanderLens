import test from "node:test";
import assert from "node:assert/strict";
import {
  rankPlaces,
  calculateRawActivity,
  calculatePercentileRanks,
  type PlaceRankingInput,
} from "./ranking.ts";

const MOCK_DESTINATION_ID = "11111111-0000-0000-0000-000000000001";

test("Case 1: Empty destination returns empty array", () => {
  const result = rankPlaces([]);
  assert.equal(result.length, 0);
});

test("Case 2: A single 5-star rating place does not outrank an established 4.8 place (Confidence smoothing)", () => {
  const places: PlaceRankingInput[] = [
    {
      id: "place-1-rating",
      name: "New Overhyped Spot",
      category: "heritage",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 5.0,
      n_ratings: 1, // Only 1 rating
      posts_30d: 0,
      checkins_30d: 0,
      likes_30d: 0,
      comments_30d: 0,
    },
    {
      id: "place-established",
      name: "Agrasen ki Baoli",
      category: "heritage",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.8,
      n_ratings: 25, // 25 ratings -> high confidence
      posts_30d: 1,
      checkins_30d: 1,
      likes_30d: 2,
      comments_30d: 0,
    },
  ];

  const ranked = rankPlaces(places);

  // The established place must be ranked first because of Bayesian confidence smoothing:
  // 1-rating confidence: 1 / (1 + 5) = 0.166
  // 25-rating confidence: 25 / (25 + 5) = 0.833
  assert.equal(ranked[0].id, "place-established");
  assert.equal(ranked[1].id, "place-1-rating");
  // The 1-rating place must not be eligible as a hidden gem (requires n_ratings >= 3)
  assert.equal(ranked[1].is_hidden_gem, false);
});

test("Case 3: Very popular place gets penalized by high activity and drops below quiet gem", () => {
  const places: PlaceRankingInput[] = [
    {
      id: "super-viral-spot",
      name: "Trending Tourist Trap",
      category: "food",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.9,
      n_ratings: 100,
      posts_30d: 80,
      checkins_30d: 120,
      likes_30d: 400,
      comments_30d: 90, // Extremely high activity
    },
    {
      id: "quiet-hidden-gem",
      name: "Historic Secret Stepwell",
      category: "heritage",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.7,
      n_ratings: 15,
      posts_30d: 1,
      checkins_30d: 2,
      likes_30d: 3,
      comments_30d: 0, // Very low activity
    },
    {
      id: "medium-place",
      name: "Neighborhood Cafe",
      category: "food",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.2,
      n_ratings: 20,
      posts_30d: 15,
      checkins_30d: 20,
      likes_30d: 50,
      comments_30d: 10,
    },
  ];

  const ranked = rankPlaces(places);

  // Quiet hidden gem must outrank the super viral tourist trap in hidden gems mode
  assert.equal(ranked[0].id, "quiet-hidden-gem");
  assert.equal(ranked[0].is_hidden_gem, true);

  // The viral place has activity_norm = 1.0 > 0.5, so it is NOT eligible as a hidden gem
  const viralResult = ranked.find((p) => p.id === "super-viral-spot")!;
  assert.equal(viralResult.is_hidden_gem, false);
});

test("Case 4: Cold start handling with seeded places", () => {
  const places: PlaceRankingInput[] = [
    {
      id: "seeded-place-1",
      name: "Panna Meena ka Kund",
      category: "heritage",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.9,
      n_ratings: 14,
      is_seeded: true,
      posts_30d: 0,
      checkins_30d: 1,
      likes_30d: 3,
      comments_30d: 0,
    },
    {
      id: "seeded-place-2",
      name: "Abhaneri Stepwell",
      category: "heritage",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.8,
      n_ratings: 12,
      is_seeded: true,
      posts_30d: 1,
      checkins_30d: 1,
      likes_30d: 2,
      comments_30d: 0,
    },
  ];

  const ranked = rankPlaces(places);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].is_seeded, true);
  assert.equal(ranked[0].is_hidden_gem, true);
  assert.ok(ranked[0].recommendation_reason.length > 0);
});

test("Case 5: Filtering by category preserves destination relative ranking", () => {
  const places: PlaceRankingInput[] = [
    {
      id: "heritage-1",
      name: "Ancient Baoli",
      category: "heritage",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.8,
      n_ratings: 18,
      posts_30d: 2,
      checkins_30d: 1,
      likes_30d: 4,
      comments_30d: 1,
    },
    {
      id: "food-1",
      name: "Traditional Chaat Corner",
      category: "food",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.6,
      n_ratings: 22,
      posts_30d: 5,
      checkins_30d: 4,
      likes_30d: 10,
      comments_30d: 2,
    },
    {
      id: "nature-1",
      name: "Forest Trail Sanctuary",
      category: "nature",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.5,
      n_ratings: 10,
      posts_30d: 1,
      checkins_30d: 0,
      likes_30d: 2,
      comments_30d: 0,
    },
  ];

  const heritageOnly = rankPlaces(places, { categoryFilter: "heritage" });
  assert.equal(heritageOnly.length, 1);
  assert.equal(heritageOnly[0].id, "heritage-1");

  const foodOnly = rankPlaces(places, { categoryFilter: "food" });
  assert.equal(foodOnly.length, 1);
  assert.equal(foodOnly[0].id, "food-1");
});

test("Case 6: Handling identical ties deterministically", () => {
  const places: PlaceRankingInput[] = [
    {
      id: "place-a",
      name: "Spot Alpha",
      category: "viewpoint",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.5,
      n_ratings: 10,
      posts_30d: 2,
      checkins_30d: 2,
      likes_30d: 5,
      comments_30d: 1,
    },
    {
      id: "place-b",
      name: "Spot Beta",
      category: "viewpoint",
      destination_id: MOCK_DESTINATION_ID,
      avg_rating: 4.5,
      n_ratings: 10,
      posts_30d: 2,
      checkins_30d: 2,
      likes_30d: 5,
      comments_30d: 1,
    },
  ];

  const ranked = rankPlaces(places);
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].score, ranked[1].score);
  assert.equal(ranked[0].activity_raw, ranked[1].activity_raw);
});
