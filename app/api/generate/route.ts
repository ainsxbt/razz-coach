import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ALLOWED_GOALS = ["reply", "flirty", "apology", "boundary", "reconnect"] as const;
const ALLOWED_TONES = ["chill", "playful", "confident", "soft"] as const;

type Goal = (typeof ALLOWED_GOALS)[number];
type Tone = (typeof ALLOWED_TONES)[number];

const SYSTEM_PROMPT = `
You are Portly Coach, a modern dating assistant.

CORE IDENTITY
Low-ego presence. Calm. Unbothered. Not performing. Not trying to impress.
When goal is "flirty", express interest subtly (warm, slightly open, not performative).

HARD RULES
- Always respect the user's selected goal and tone exactly.
- Echo them unchanged in the JSON response.
- Return valid JSON only. No extra text before or after.
- No pickup artist language. No push-pull. No jealousy tactics. No escalation. No self-positioning.

JSON SCHEMA (MUST MATCH EXACTLY)
{
  "classification": "SIMPLE" | "COMPLEX",
  "goal": string,
  "tone": string,
  "replies": [
    { "text": string, "why": string },
    { "text": string, "why": string },
    { "text": string, "why": string }
  ],
  "notes": [string]
}

STYLE
- Replies feel typed quickly.
- Avoid polished sentence rhythm.
- Fragments ok. Lowercase ok.
- Max 2 lines per reply.
- Max 1 emoji (rare).
- Shorter is better.

WHY RULES
- Max 10 words.
- Casual tone.
- No strategy language.
- No analysis.
`.trim();

function classify(conversation: string) {
  return conversation.length < 300 ? "SIMPLE" : "COMPLEX";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const goal = body?.goal as Goal;
    const tone = body?.tone as Tone;
    const conversation = (body?.conversation ?? "") as string;

    // Validate enums
    if (!ALLOWED_GOALS.includes(goal)) {
      return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
    }
    if (!ALLOWED_TONES.includes(tone)) {
      return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
    }
    if (!conversation.trim()) {
      return NextResponse.json({ error: "Conversation is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // New SDK from Google docs
    const ai = new GoogleGenAI({ apiKey });

    const userPrompt = `
Goal: ${goal}
Tone: ${tone}
Conversation:
${conversation}

Return JSON only following the schema.
classification should be "${classify(conversation)}" unless clearly COMPLEX.
`.trim();

    // Model name from Google docs example
    const resp = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const text = (resp.text ?? "").trim();

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Gemini did not return valid JSON", raw: text },
        { status: 502 }
      );
    }

    if (!json?.replies || !Array.isArray(json.replies) || json.replies.length !== 3) {
      return NextResponse.json(
        { error: "Bad JSON shape from model", raw: json },
        { status: 502 }
      );
    }

    return NextResponse.json(json);
  } catch (error: any) {
    console.error("GEMINI API ERROR:", error);
    return NextResponse.json(
      { error: "Server error", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
