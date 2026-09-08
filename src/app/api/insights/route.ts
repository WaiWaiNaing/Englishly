import { NextResponse } from "next/server";
import { getLLM } from "@/lib/llm";
import { getSessionUserId } from "@/lib/session";
import { quotaAwareError } from "@/lib/quotaAwareError";
import {
  MIN_SAMPLES_REQUIRED,
  gatherWritingSamples,
  getCachedInsights,
  saveInsights,
} from "@/lib/insights";

export async function GET(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cached = await getCachedInsights(userId);
  return NextResponse.json(cached ?? { tips: [], messageCount: 0, createdAt: null });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const samples = await gatherWritingSamples(userId);
  if (samples.length < MIN_SAMPLES_REQUIRED) {
    return NextResponse.json(
      {
        error: `Not enough history yet — you have ${samples.length}, need at least ${MIN_SAMPLES_REQUIRED} rewrites.`,
      },
      { status: 400 },
    );
  }

  let tips;
  try {
    tips = await getLLM().analyzeWritingPatterns(samples);
  } catch (error) {
    const { error: message, status } = quotaAwareError(error);
    return NextResponse.json({ error: message }, { status });
  }

  const result = await saveInsights(userId, tips, samples.length);
  return NextResponse.json(result);
}
