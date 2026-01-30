/**
 * GET /api/circonscriptions/geojson
 * Returns a GeoJSON FeatureCollection of all circonscriptions (id, label in properties, geometry)
 * for use as an overlay on a map of France.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../lib/supabase";
import { ApiError, handleError } from "../../lib/errors";

/** Minimal GeoJSON geometry type for Feature geometry property */
type GeoJSONGeometry = object;

interface GeoJSONFeature {
  type: "Feature";
  properties: { id: string; label: string };
  geometry: GeoJSONGeometry;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "MethodNotAllowed",
      message: "Only GET requests are allowed",
      status: 405,
    });
  }

  try {
    const { data: rows, error } = await supabase
      .from("circonscriptions")
      .select("id, label, geometry")
      .not("geometry", "is", null)
      .order("id", { ascending: true });

    if (error) {
      throw new ApiError(
        500,
        "Failed to fetch circonscriptions",
        "DatabaseError",
      );
    }

    const features: GeoJSONFeature[] = (rows ?? [])
      .filter(
        (r): r is { id: string; label: string; geometry: object } =>
          typeof r.id === "string" &&
          typeof r.label === "string" &&
          r.geometry != null &&
          typeof r.geometry === "object",
      )
      .map((r) => ({
        type: "Feature" as const,
        properties: { id: r.id, label: r.label },
        geometry: r.geometry as GeoJSONGeometry,
      }));

    const collection: GeoJSONFeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.setHeader("Content-Type", "application/geo+json");
    return res.status(200).json(collection);
  } catch (error) {
    return handleError(res, error);
  }
}
