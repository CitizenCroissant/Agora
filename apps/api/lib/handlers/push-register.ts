/**
 * POST /api/push/register - Register Expo push token (and optional topic/deputy)
 * DELETE /api/push/register - Unregister Expo push token
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";

const EXPO_TOKEN_PREFIX = "ExponentPushToken[";
const EXPO_TOKEN_SUFFIX = "]";

function isValidExpoPushToken(token: unknown): token is string {
  if (typeof token !== "string" || !token.trim()) return false;
  return (
    token.startsWith(EXPO_TOKEN_PREFIX) && token.endsWith(EXPO_TOKEN_SUFFIX)
  );
}

type Topic = "all" | "my_deputy";

function isValidTopic(topic: unknown): topic is Topic {
  return topic === "all" || topic === "my_deputy";
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only POST and DELETE requests are allowed",
      status: 405,
    });
    return;
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const expo_push_token =
      typeof body.expo_push_token === "string"
        ? body.expo_push_token.trim()
        : "";

    if (!isValidExpoPushToken(expo_push_token)) {
      throw new ApiError(
        400,
        "Invalid or missing expo_push_token (expected ExponentPushToken[...])",
        "BadRequest"
      );
    }

    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("push_tokens")
        .delete()
        .eq("expo_push_token", expo_push_token);

      if (error) {
        console.error("Supabase error:", error);
        throw new ApiError(500, "Failed to unregister token", "DatabaseError");
      }

      res.status(200).json({ ok: true, message: "Token unregistered" });
      return;
    }

    // POST: register or upsert
    const topic = isValidTopic(body.topic) ? body.topic : "all";
    const deputy_acteur_ref =
      topic === "my_deputy" && typeof body.deputy_acteur_ref === "string"
        ? body.deputy_acteur_ref.trim() || null
        : null;

    const { error } = await supabase.from("push_tokens").upsert(
      {
        expo_push_token,
        topic,
        deputy_acteur_ref,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "expo_push_token",
      }
    );

    if (error) {
      console.error("Supabase error:", error);
      throw new ApiError(500, "Failed to register token", "DatabaseError");
    }

    res.status(200).json({ ok: true, message: "Token registered" });
  } catch (error) {
    handleError(res, error);
  }
}
