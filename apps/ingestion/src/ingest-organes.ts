/**
 * Ingest organes (commissions, delegations, etc.) from Assemblée nationale AMO data.
 * Uses the same AMO ZIP as deputies; extracts organes from the parsed export.
 * Run this before ingesting commission reunions so sittings.organe_ref can be resolved.
 */

import { supabase } from "./supabase";
import { deputiesClient, extractUid } from "./deputies-client";
import type { AssembleeOrgane } from "./deputies-types";

export interface OrganeInsert {
  id: string;
  libelle: string | null;
  libelle_abrege: string | null;
  type_organe: string;
  official_url: string | null;
}

const LEGISLATURE = 17;

function buildOfficialUrl(organeId: string): string {
  return `https://www.assemblee-nationale.fr/dyn/${LEGISLATURE}/organes/${organeId}`;
}

function getText(val: unknown): string | null {
  if (typeof val === "string" && val.trim()) return val.trim();
  if (val && typeof val === "object" && "#text" in val) {
    const t = (val as { "#text"?: unknown })["#text"];
    return typeof t === "string" && t.trim() ? t.trim() : null;
  }
  return null;
}

function organeToRow(organeId: string, o: AssembleeOrgane): OrganeInsert {
  const libelle = getText(o.libelle) ?? null;
  const libelleAbrege = getText(o.libelleAbrege) ?? null;
  const typeOrgane =
    getText((o as { codeType?: unknown }).codeType) ??
    getText((o as { codeTypeOrgane?: unknown }).codeTypeOrgane) ??
    getText(o.typeOrgane) ??
    "ORGANE";

  return {
    id: organeId,
    libelle: libelle || null,
    libelle_abrege: libelleAbrege || null,
    type_organe: typeOrgane,
    official_url: buildOfficialUrl(organeId)
  };
}

export async function ingestOrganes(options: { dryRun?: boolean } = {}) {
  const { dryRun = false } = options;

  const raw = await deputiesClient.fetchAllDeputies();
  const organesMap = raw[0]?.organesMap ?? new Map<string, AssembleeOrgane>();

  const rows: OrganeInsert[] = [];
  for (const [key, organe] of organesMap) {
    const id = extractUid(organe?.uid) ?? key;
    if (!id) continue;
    rows.push(organeToRow(id, organe));
  }

  console.log(`Organes: ${rows.length} from AMO`);

  if (dryRun) {
    const sample = rows.slice(0, 5);
    sample.forEach((r) =>
      console.log(`Would upsert: ${r.id} type=${r.type_organe} libelle=${r.libelle_abrege ?? r.libelle}`)
    );
    return { organes: 0 };
  }

  const BATCH_SIZE = 200;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("organes").upsert(batch, {
      onConflict: "id",
      ignoreDuplicates: false
    });
    if (error) {
      console.error(`Error upserting organes batch ${i}-${i + batch.length - 1}`, error);
      continue;
    }
    upserted += batch.length;
  }

  console.log(`Organes: ${upserted} upserted (out of ${rows.length})`);
  return { organes: upserted };
}
