/**
 * Supabase client configuration
 */

import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_KEY environment variable");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Fetch the most recent last_synced_at from source_metadata.
 * Returns an ISO string, or null if no metadata exists.
 */
export async function getLastIngestionDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from("source_metadata")
    .select("last_synced_at")
    .order("last_synced_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.last_synced_at as string;
}
