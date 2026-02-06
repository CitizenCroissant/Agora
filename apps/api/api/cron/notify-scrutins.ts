/**
 * GET /api/cron/notify-scrutins
 * Called by Vercel cron (e.g. 0 3 * * *) to send "new scrutins" push notifications.
 * Requires Authorization: Bearer CRON_SECRET (or PUSH_NOTIFY_SECRET).
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { Expo } from "expo-server-sdk";
import { supabase } from "../../lib/supabase";

const secret = process.env.CRON_SECRET ?? process.env.PUSH_NOTIFY_SECRET ?? "";

function getSinceIso(): string {
  const d = new Date();
  d.setHours(d.getHours() - 24, 0, 0, 0);
  return d.toISOString();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET and POST are allowed",
      status: 405,
    });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid authorization",
      status: 401,
    });
    return;
  }

  try {
    const since = getSinceIso();

    const { data: scrutins, error: scrutinsError } = await supabase
      .from("scrutins")
      .select("id")
      .gte("created_at", since)
      .limit(500);

    if (scrutinsError) {
      console.error("Supabase scrutins error:", scrutinsError);
      res.status(500).json({
        error: "DatabaseError",
        message: "Failed to fetch scrutins",
      });
      return;
    }

    const count = scrutins?.length ?? 0;
    if (count === 0) {
      res.status(200).json({
        ok: true,
        message: "No new scrutins",
        sent: 0,
      });
      return;
    }

    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("expo_push_token")
      .eq("topic", "all");

    if (tokensError) {
      console.error("Supabase push_tokens error:", tokensError);
      res.status(500).json({
        error: "DatabaseError",
        message: "Failed to fetch push tokens",
      });
      return;
    }

    const pushTokens = (tokens ?? [])
      .map((r: { expo_push_token: string }) => r.expo_push_token)
      .filter((t: string) => t && t.startsWith("ExponentPushToken["));

    if (pushTokens.length === 0) {
      res.status(200).json({
        ok: true,
        message: "No tokens to notify",
        sent: 0,
      });
      return;
    }

    const expo = new Expo();
    const title =
      count === 1 ? "1 nouveau scrutin" : `${count} nouveaux scrutins`;
    const body = "Consultez les votes à l'Assemblée nationale.";
    const scrutinId = scrutins[0]?.id;

    const messages = pushTokens
      .filter((token: string) => Expo.isExpoPushToken(token))
      .map((token: string) => ({
        to: token,
        sound: "default" as const,
        title,
        body,
        data: scrutinId ? { screen: "votes", scrutinId } : { screen: "votes" },
      }));

    let sent = 0;
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      sent += tickets.filter((t) => t.status === "ok").length;
    }

    res.status(200).json({
      ok: true,
      message: "Notifications sent",
      sent,
      tokens: pushTokens.length,
    });
  } catch (error) {
    console.error("notify-scrutins error:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
