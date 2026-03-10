/**
 * GET /api/follows — list follows for device_id (header X-Device-Id)
 * POST /api/follows — add follow (body: follow_type, follow_id; header X-Device-Id)
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";

const FOLLOW_TYPES = ["deputy", "bill", "group"] as const;

function getDeviceId(req: VercelRequest): string | null {
  const header = req.headers["x-device-id"];
  if (typeof header === "string" && header.trim()) return header.trim();
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const id = (body.device_id as string)?.trim();
  return id || null;
}

function validateFollowType(t: unknown): t is "deputy" | "bill" | "group" {
  return typeof t === "string" && FOLLOW_TYPES.includes(t as (typeof FOLLOW_TYPES)[number]);
}

/** Validate follow_id exists in DB for the given type */
async function validateFollowId(
  followType: "deputy" | "bill" | "group",
  followId: string
): Promise<void> {
  if (followType === "deputy") {
    const { data, error } = await supabase
      .from("deputies")
      .select("acteur_ref")
      .eq("acteur_ref", followId)
      .limit(1)
      .maybeSingle();
    if (error || !data) throw new ApiError(404, "Deputy not found", "NotFound");
    return;
  }
  if (followType === "bill") {
    const { data, error } = await supabase
      .from("dossiers_legislatifs")
      .select("id")
      .eq("id", followId)
      .limit(1)
      .maybeSingle();
    if (error || !data) throw new ApiError(404, "Bill not found", "NotFound");
    return;
  }
  if (followType === "group") {
    const { data, error } = await supabase
      .from("political_groups_metadata")
      .select("slug")
      .eq("slug", followId)
      .limit(1)
      .maybeSingle();
    if (error || !data) throw new ApiError(404, "Group not found", "NotFound");
    return;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Device-Id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET and POST are allowed",
      status: 405
    });
  }

  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return res.status(400).json({
      error: "BadRequest",
      message: "X-Device-Id header or body device_id is required",
      status: 400
    });
  }

  try {
    if (req.method === "GET") {
      const { data: rows, error } = await supabase
        .from("follows")
        .select("follow_type, follow_id")
        .eq("device_id", deviceId);

      if (error) {
        console.error("follows list error:", error);
        throw new ApiError(500, "Failed to list follows", "DatabaseError");
      }

      const follows = {
        deputy: [] as string[],
        bill: [] as string[],
        group: [] as string[]
      };
      for (const row of rows ?? []) {
        const r = row as { follow_type: string; follow_id: string };
        if (r.follow_type === "deputy") follows.deputy.push(r.follow_id);
        else if (r.follow_type === "bill") follows.bill.push(r.follow_id);
        else if (r.follow_type === "group") follows.group.push(r.follow_id);
      }
      return res.status(200).json({ follows });
    }

    // POST
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const followType = (body.follow_type as string)?.trim();
    const followId = (body.follow_id as string)?.trim();

    if (!followType || !followId) {
      throw new ApiError(400, "follow_type and follow_id are required", "BadRequest");
    }
    if (!validateFollowType(followType)) {
      throw new ApiError(400, "follow_type must be deputy, bill, or group", "BadRequest");
    }

    await validateFollowId(followType, followId);

    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("device_id", deviceId)
      .eq("follow_type", followType)
      .eq("follow_id", followId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Already following",
        follow_type: followType,
        follow_id: followId
      });
    }

    const { error: insertError } = await supabase.from("follows").insert({
      device_id: deviceId,
      follow_type: followType,
      follow_id: followId
    });

    if (insertError) {
      console.error("follows insert error:", insertError);
      throw new ApiError(500, "Failed to add follow", "DatabaseError");
    }

    return res.status(201).json({
      ok: true,
      message: "Following",
      follow_type: followType,
      follow_id: followId
    });
  } catch (error) {
    return handleError(res, error);
  }
}
