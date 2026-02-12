/**
 * Persistent ingestion logger
 *
 * Writes start/success/error entries to the `ingestion_logs` table in Supabase
 * so that cron execution history survives beyond Vercel's 1-hour log retention
 * on the Hobby plan.
 */

import { supabase } from "./supabase";

export type JobName = "ingest" | "ingest-scrutins" | "ingest-deputies";
export type TriggeredBy = "cron" | "manual";

export interface IngestionLogEntry {
  id: string;
  job_name: JobName;
  triggered_by: TriggeredBy;
  started_at: string;
}

/**
 * Record the start of an ingestion job.
 * Returns the log entry (with its id) so callers can later mark it
 * as success or error.
 */
export async function logStart(
  jobName: JobName,
  triggeredBy: TriggeredBy
): Promise<IngestionLogEntry | null> {
  const { data, error } = await supabase
    .from("ingestion_logs")
    .insert({
      job_name: jobName,
      triggered_by: triggeredBy,
      status: "running"
    })
    .select("id, job_name, triggered_by, started_at")
    .single();

  if (error) {
    console.error("Failed to write ingestion log (start):", error.message);
    return null;
  }

  return data as IngestionLogEntry;
}

/**
 * Mark an ingestion job as successfully completed.
 */
export async function logSuccess(
  logId: string,
  details: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();

  // Fetch started_at to compute duration
  const { data: entry } = await supabase
    .from("ingestion_logs")
    .select("started_at")
    .eq("id", logId)
    .single();

  const durationMs = entry?.started_at
    ? Date.now() - new Date(entry.started_at).getTime()
    : null;

  const { error } = await supabase
    .from("ingestion_logs")
    .update({
      status: "success",
      finished_at: now,
      duration_ms: durationMs,
      details
    })
    .eq("id", logId);

  if (error) {
    console.error("Failed to write ingestion log (success):", error.message);
  }
}

/**
 * Mark an ingestion job as failed.
 */
export async function logError(
  logId: string,
  errorMessage: string,
  details?: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();

  const { data: entry } = await supabase
    .from("ingestion_logs")
    .select("started_at")
    .eq("id", logId)
    .single();

  const durationMs = entry?.started_at
    ? Date.now() - new Date(entry.started_at).getTime()
    : null;

  const { error } = await supabase
    .from("ingestion_logs")
    .update({
      status: "error",
      finished_at: now,
      duration_ms: durationMs,
      error_message: errorMessage,
      details: details ?? null
    })
    .eq("id", logId);

  if (error) {
    console.error("Failed to write ingestion log (error):", error.message);
  }
}

/**
 * Detect whether the call was made by Vercel cron or manually.
 * Vercel cron sends "Authorization: Bearer <CRON_SECRET>"; manual curl may use raw CRON_SECRET.
 */
export function detectTrigger(authHeader: string | undefined): TriggeredBy {
  if (!authHeader) return "manual";
  const cronSecret = process.env.CRON_SECRET;
  if (
    cronSecret &&
    (authHeader === cronSecret || authHeader === `Bearer ${cronSecret}`)
  )
    return "cron";
  return "manual";
}
