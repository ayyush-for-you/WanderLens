import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  SCAN_CONFIDENCE_THRESHOLD,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  SCAN_GPS_BOOST,
  SCAN_GPS_BOOST_RADIUS_METRES,
} from "@/config/constants";

interface FastApiResponse {
  status: "match" | "candidates" | "no_match";
  best_match?: {
    monument_id: string;
    name: string;
    confidence: number;
    distance_metres?: number;
    gps_boost_applied?: boolean;
  } | null;
  candidates?: Array<{
    monument_id: string;
    name: string;
    confidence: number;
    distance_metres?: number;
  }>;
  monument_id?: string | null;
  confidence?: number | null;
}

interface GeminiMonumentResult {
  is_monument: boolean;
  name: string | null;
  city_or_region: string | null;
  country: string | null;
  built_year: number | null;
  builder: string | null;
  style: string | null;
  history_text: string | null;
  confidence: number;
  reason?: string | null;
}

function calculateDistanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function recognizeWithGemini(
  imageFile: File,
  apiKey: string
): Promise<GeminiMonumentResult | null> {
  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `You are an expert architectural historian and monument recognition AI.
Analyze this image carefully and determine if it shows a recognizable monument, heritage site, fort, palace, temple, mosque, church, museum, statue, or famous landmark.
Respond ONLY with valid JSON matching this exact schema:
{
  "is_monument": boolean,
  "name": string or null,
  "city_or_region": string or null,
  "country": string or null,
  "built_year": integer or null,
  "builder": string or null,
  "style": string or null,
  "history_text": string or null (2-4 concise sentences about its history and significance),
  "confidence": number between 0.0 and 1.0,
  "reason": string or null (if is_monument is false or confidence < 0.5, briefly explain what the image appears to show instead)
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: imageFile.type || "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("Gemini Vision API error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as GeminiMonumentResult;
    return parsed;
  } catch (err) {
    console.warn("Gemini Vision call failed:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const latStr = formData.get("latitude") as string | null;
    const lngStr = formData.get("longitude") as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    // 1. Validate file size and type
    if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image exceeds 5MB size limit" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, or WebP images are allowed" },
        { status: 400 }
      );
    }

    const latitude = latStr ? parseFloat(latStr) : null;
    const longitude = lngStr ? parseFloat(lngStr) : null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Attempt recognition via FastAPI CLIP microservice if configured
    const serviceUrl = process.env.RECOGNITION_SERVICE_URL;
    let recognitionResult: FastApiResponse | null = null;

    if (serviceUrl) {
      try {
        const serviceFormData = new FormData();
        serviceFormData.append("image", imageFile, imageFile.name);

        let serviceEndpoint = `${serviceUrl}/recognize?threshold=${SCAN_CONFIDENCE_THRESHOLD}`;
        if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
          serviceEndpoint += `&latitude=${latitude}&longitude=${longitude}`;
        }

        const res = await fetch(serviceEndpoint, {
          method: "POST",
          body: serviceFormData,
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          recognitionResult = (await res.json()) as FastApiResponse;
        }
      } catch (err) {
        console.warn("Recognition microservice unavailable:", err);
      }
    }

    // 3. Attempt Gemini Vision AI if FastAPI wasn't used or failed
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!recognitionResult && geminiKey) {
      const gemini = await recognizeWithGemini(imageFile, geminiKey);
      if (gemini) {
        if (gemini.is_monument && gemini.name && gemini.confidence >= 0.45) {
          // Try matching against curated monuments in Supabase first
          const { data: curatedMatches } = await supabase
            .from("monuments")
            .select("*, destinations(id, name, region)")
            .eq("is_published", true)
            .ilike("name", `%${gemini.name.trim()}%`)
            .limit(1);

          let matchedMonument: any = curatedMatches?.[0] ?? null;
          let historicalImage: any = null;

          if (matchedMonument) {
            const { data: images } = await supabase
              .from("monument_images")
              .select("*")
              .eq("monument_id", matchedMonument.id)
              .eq("kind", "historic")
              .limit(1);
            if (images && images.length > 0) historicalImage = images[0];
          } else {
            // Synthesize dynamic monument card for any worldwide monument identified by AI
            const slug = gemini.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
            matchedMonument = {
              id: `ai-${slug || Date.now()}`,
              name: gemini.name,
              built_year: gemini.built_year ?? null,
              builder: gemini.builder ?? null,
              style: gemini.style ?? null,
              history_text:
                gemini.history_text ||
                `${gemini.name} is a notable landmark located in ${gemini.city_or_region || "this region"}.`,
              destinations: {
                id: "ai-destination",
                name: gemini.city_or_region || "Heritage Site",
                region: gemini.country || "",
              },
            };
          }

          let scanId: string | null = null;
          if (user && curatedMatches?.[0]) {
            const { data: scanRow } = await supabase
              .from("scans")
              .insert({
                user_id: user.id,
                monument_id: curatedMatches[0].id,
                confidence: gemini.confidence,
              } as any)
              .select("id")
              .single();
            if (scanRow) scanId = (scanRow as any).id;
          }

          return NextResponse.json({
            status: "match",
            confidence_threshold: SCAN_CONFIDENCE_THRESHOLD,
            confidence: Math.round(gemini.confidence * 100) / 100,
            monument: matchedMonument,
            historical_image: historicalImage,
            candidates: [],
            scan_id: scanId,
          });
        }

        // Image is not a monument or confidence too low
        return NextResponse.json({
          status: "no_match",
          confidence_threshold: SCAN_CONFIDENCE_THRESHOLD,
          confidence: gemini.confidence ?? 0,
          monument: null,
          historical_image: null,
          candidates: [],
          scan_id: null,
          ai_reason:
            gemini.reason ||
            "No recognizable monument or heritage landmark detected in this photo.",
        });
      }
    }

    // 4. Honest fallback if neither FastAPI nor Gemini AI is available:
    //    Only match if filename or close GPS proximity actually matches; never fake a 65% match.
    if (!recognitionResult) {
      const { data: monuments } = await supabase
        .from("monuments")
        .select("id, name, location, destinations(name)")
        .eq("is_published", true);

      if (monuments && monuments.length > 0) {
        const candidateScores: Array<{
          monument_id: string;
          name: string;
          confidence: number;
          distance_metres?: number;
        }> = [];

        for (const m of monuments as any[]) {
          let score = 0;
          let dist: number | null = null;

          const fileNameLower = imageFile.name.toLowerCase();
          const monumentNameLower = (m.name || "").toLowerCase();
          if (
            fileNameLower.includes(monumentNameLower) ||
            monumentNameLower
              .split(" ")
              .some((w: string) => w.length > 3 && fileNameLower.includes(w))
          ) {
            score = Math.max(score, 0.85);
          }

          if (latitude !== null && longitude !== null && m.location) {
            try {
              let mLat: number | null = null;
              let mLng: number | null = null;
              const locStr = String(m.location);
              if (locStr.includes("POINT")) {
                const parts = locStr.replace("POINT(", "").replace(")", "").trim().split(" ");
                mLng = parseFloat(parts[0]);
                mLat = parseFloat(parts[1]);
              }
              if (mLat !== null && mLng !== null && !isNaN(mLat) && !isNaN(mLng)) {
                dist = calculateDistanceMetres(latitude, longitude, mLat, mLng);
                if (dist <= SCAN_GPS_BOOST_RADIUS_METRES) {
                  score = Math.min(1.0, Math.max(score, 0.55) + SCAN_GPS_BOOST);
                }
              }
            } catch {
              // ignore coordinate parse error
            }
          }

          if (score > 0) {
            candidateScores.push({
              monument_id: m.id as string,
              name: m.name as string,
              confidence: Math.round(score * 100) / 100,
              distance_metres: dist ? Math.round(dist) : undefined,
            });
          }
        }

        if (candidateScores.length > 0) {
          candidateScores.sort((a, b) => b.confidence - a.confidence);
          const topBest = candidateScores[0];
          const isMatch = topBest.confidence >= SCAN_CONFIDENCE_THRESHOLD;
          recognitionResult = {
            status: isMatch ? "match" : "candidates",
            best_match: topBest,
            candidates: candidateScores.slice(0, 3),
            monument_id: isMatch ? topBest.monument_id : null,
            confidence: topBest.confidence,
          };
        } else {
          return NextResponse.json({
            status: "no_match",
            confidence_threshold: SCAN_CONFIDENCE_THRESHOLD,
            confidence: null,
            monument: null,
            historical_image: null,
            candidates: [],
            scan_id: null,
            needs_api_key: !geminiKey && !serviceUrl,
            ai_reason: !geminiKey
              ? "Visual AI recognition requires GEMINI_API_KEY in your environment variables. You can still search monuments manually below."
              : "Could not identify a monument from this image.",
          });
        }
      } else {
        recognitionResult = { status: "no_match", candidates: [] };
      }
    }

    // 5. Fetch details for matched curated monument or candidates
    let matchedMonument: any = null;
    let historicalImage: any = null;

    if (recognitionResult.status === "match" && recognitionResult.best_match?.monument_id) {
      const { data: monData } = await supabase
        .from("monuments")
        .select("*, destinations(id, name, region)")
        .eq("id", recognitionResult.best_match.monument_id)
        .single();

      matchedMonument = monData;

      const { data: images } = await supabase
        .from("monument_images")
        .select("*")
        .eq("monument_id", recognitionResult.best_match.monument_id)
        .eq("kind", "historic")
        .limit(1);

      if (images && images.length > 0) {
        historicalImage = images[0];
      }
    }

    let candidateDetails: any[] = [];
    if (recognitionResult.candidates && recognitionResult.candidates.length > 0) {
      const candidateIds = recognitionResult.candidates.map((c) => c.monument_id);
      const { data: cData } = await supabase
        .from("monuments")
        .select("id, name, built_year, builder, destinations(name)")
        .in("id", candidateIds);

      candidateDetails = recognitionResult.candidates.map((c) => {
        const found = (cData as any[])?.find((m: any) => m.id === c.monument_id);
        return {
          ...c,
          built_year: found?.built_year,
          builder: found?.builder,
          destination_name: (found as any)?.destinations?.name,
        };
      });
    }

    let scanId: string | null = null;
    if (user) {
      const { data: scanRow } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          monument_id: matchedMonument ? matchedMonument.id : null,
          confidence: recognitionResult.best_match?.confidence || null,
        } as any)
        .select("id")
        .single();

      if (scanRow) scanId = (scanRow as any).id;
    }

    return NextResponse.json({
      status: recognitionResult.status,
      confidence_threshold: SCAN_CONFIDENCE_THRESHOLD,
      confidence: recognitionResult.best_match?.confidence ?? null,
      monument: matchedMonument,
      historical_image: historicalImage,
      candidates: candidateDetails,
      scan_id: scanId,
    });
  } catch (error: any) {
    console.error("Scan processing error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process monument scan" },
      { status: 500 }
    );
  }
}
