/**
 * Ingest deputy membership in organes (commissions, etc.) from AMO mandats.
 * Run after ingest:organes and ingest:deputies so organes and deputies tables exist.
 */

import { supabase } from "./supabase";
import { deputiesClient, extractUid } from "./deputies-client";
import type { AssembleeMandat } from "./deputies-types";

const COMMISSION_TYPE_ORGANES = new Set([
  "COMPER", // Commission permanente
  "COMEU",  // Commission d'enquête
  "COSP",   // Commission spéciale
  "MINS",   // Mission d'information
  "DELE",   // Délégation
  "GE",     // Groupe d'études
  "GA"      // Groupe d'amitié
]);

export interface DeputyOrganeInsert {
  acteur_ref: string;
  organe_ref: string;
  date_debut: string | null;
  date_fin: string | null;
}

function toList<T>(x: T | T[] | null | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

function parseDate(d: string | undefined): string | null {
  if (!d || typeof d !== "string") return null;
  const part = d.split("T")[0];
  return part && part.match(/^\d{4}-\d{2}-\d{2}$/) ? part : null;
}

const PAGE_SIZE = 1000;

async function fetchAllOrganeIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from("organes")
      .select("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch organes: ${error.message}`);
    const page = data ?? [];
    for (const r of page) ids.add(r.id);
    hasMore = page.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }
  return ids;
}

export async function ingestDeputyOrganes(options: { dryRun?: boolean } = {}) {
  const { dryRun = false } = options;

  const [rawDeputies, validOrganeIds] = await Promise.all([
    deputiesClient.fetchAllDeputies(),
    fetchAllOrganeIds()
  ]);

  const rows: DeputyOrganeInsert[] = [];

  for (const { acteur, organesMap } of rawDeputies) {
    const acteurRef = extractUid(acteur?.uid);
    if (!acteurRef) continue;

    const mandats = toList(acteur.mandats?.mandat);
    for (const m of mandats) {
      const organeRef =
        extractUid((m as AssembleeMandat).organeRef) ??
        extractUid((m as AssembleeMandat).organes?.organeRef);
      if (!organeRef || !validOrganeIds.has(organeRef)) continue;

      const organe = organesMap.get(organeRef);
      const rawType =
        (organe as { codeType?: unknown })?.codeType ??
        (organe as { codeTypeOrgane?: unknown })?.codeTypeOrgane ??
        organe?.typeOrgane;
      const typeOrgane =
        typeof rawType === "string"
          ? rawType
          : rawType && typeof rawType === "object" && "#text" in rawType
            ? (rawType as { "#text"?: string })["#text"]
            : null;
      const isCommission =
        typeOrgane && COMMISSION_TYPE_ORGANES.has(typeOrgane);
      if (!isCommission) continue;

      rows.push({
        acteur_ref: acteurRef,
        organe_ref: organeRef,
        date_debut: parseDate((m as AssembleeMandat).dateDebut),
        date_fin: parseDate((m as AssembleeMandat).dateFin)
      });
    }
  }

  const deduped = dedupeByActeurOrgane(rows);
  console.log(
    `Deputy-organes: ${deduped.length} unique membership(s) from AMO (organes in DB: ${validOrganeIds.size})`
  );

  if (dryRun) {
    deduped.slice(0, 5).forEach((r) =>
      console.log(`Would upsert: ${r.acteur_ref} -> ${r.organe_ref}`)
    );
    return { deputy_organes: 0 };
  }

  let upserted = 0;
  const BATCH_SIZE = 300;
  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("deputy_organes").upsert(batch, {
      onConflict: "acteur_ref,organe_ref",
      ignoreDuplicates: false
    });
    if (error) {
      console.error(
        `Error upserting deputy_organes batch ${i}-${i + batch.length - 1} (of ${deduped.length})`,
        error
      );
      continue;
    }
    upserted += batch.length;
  }

  console.log(`Deputy-organes: ${upserted} upserted (out of ${deduped.length})`);
  return { deputy_organes: upserted };
}

function dedupeByActeurOrgane(
  rows: DeputyOrganeInsert[]
): DeputyOrganeInsert[] {
  const byKey = new Map<string, DeputyOrganeInsert>();
  for (const r of rows) {
    const key = `${r.acteur_ref}\t${r.organe_ref}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, r);
      continue;
    }
    const rFin = r.date_fin ?? "9999-12-31";
    const exFin = existing.date_fin ?? "9999-12-31";
    if (rFin > exFin) byKey.set(key, r);
  }
  return [...byKey.values()];
}
