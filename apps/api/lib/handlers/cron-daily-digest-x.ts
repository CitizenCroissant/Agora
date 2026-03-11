import type { VercelRequest, VercelResponse } from "@vercel/node";
import { TwitterApi } from "twitter-api-v2";

type Sitting = {
  id: string;
  title: string;
  description: string;
  time_range?: string;
};

type AgendaResponse = {
  date: string;
  sittings: Sitting[];
};

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchAgenda(date: string): Promise<AgendaResponse | null> {
  const baseUrl =
    process.env.TWITTER_AGENDA_API_URL ?? "https://api.agora-citoyens.fr/api";

  const url = `${baseUrl.replace(/\/+$/, "")}/agenda?date=${encodeURIComponent(
    date
  )}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to fetch agenda", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as AgendaResponse;
  return data;
}

function buildDigestTweet(agenda: AgendaResponse): string {
  const { sittings } = agenda;
  const count = sittings.length;

  const themes = sittings
    .map((s) => s.title || s.description)
    .filter(Boolean)
    .slice(0, 3);

  const parts: string[] = [];

  parts.push("🏛️ Aujourd’hui à l’Assemblée – digest");
  parts.push(`• ${count} séance(s) prévue(s).`);

  if (themes.length > 0) {
    parts.push(`• Thèmes du jour : ${themes.join(", ")}.`);
  }

  parts.push("");
  parts.push("👉 Détail des séances : https://www.agora-citoyens.fr/");

  return parts.join("\n");
}

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    const appKey = process.env.TWITTER_API_KEY;
    const appSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
      console.error("Missing required Twitter env vars");
      return res.status(500).json({
        ok: false,
        message: "Missing required Twitter env vars"
      });
    }

    const date = getTodayDate();
    const agenda = await fetchAgenda(date);

    if (!agenda || !agenda.sittings || agenda.sittings.length === 0) {
      console.log("No sittings for today, cron will not post.");
      return res.status(200).json({
        ok: true,
        posted: false,
        reason: "no_sittings"
      });
    }

    const tweet = buildDigestTweet(agenda);

    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret
    });

    const result = await client.v2.tweet(tweet);

    return res.status(200).json({
      ok: true,
      posted: true,
      tweetId: result.data.id
    });
  } catch (error) {
    console.error("cron/daily-digest-x failed", error);
    return res.status(500).json({
      ok: false,
      message: "cron/daily-digest-x failed"
    });
  }
}

