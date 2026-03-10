/**
 * DELETE /api/follows/:follow_type/:follow_id — remove follow (header X-Device-Id)
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";
import { ApiError, handleError } from "../errors";

const FOLLOW_TYPES = ["deputy", "bill", "group"] as const;

function getDeviceId(req: VercelRequest): string | null {
  const header = req.headers["x-device-id"];
  if (typeof header === "string" && header.trim()) return header.trim();
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Device-Id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only DELETE is allowed",
      status: 405
    });
  }

  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return res.status(400).json({
      error: "BadRequest",
      message: "X-Device-Id header is required",
      status: 400
    });
  }

  try {
    const pathParams = (req as VercelRequest & { pathParams?: Record<string, string> }).pathParams;
    const followType = pathParams?.follow_type;
    const followId = pathParams?.follow_id;

    if (!followType || !followId) {
      throw new ApiError(400, "follow_type and follow_id are required", "BadRequest");
    }
    if (!FOLLOW_TYPES.includes(followType as (typeof FOLLOW_TYPES)[number])) {
      throw new ApiError(400, "follow_type must be deputy, bill, or group", "BadRequest");
    }

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("device_id", deviceId)
      .eq("follow_type", followType)
      .eq("follow_id", followId);

    if (error) {
      console.error("follows delete error:", error);
      throw new ApiError(500, "Failed to remove follow", "DatabaseError");
    }

    return res.status(200).json({
      ok: true,
      message: "Unfollowed",
      follow_type: followType,
      follow_id: followId
    });
  } catch (error) {
    return handleError(res, error);
  }
}
