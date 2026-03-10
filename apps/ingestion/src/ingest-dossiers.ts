/**
 * Ingest legislative dossiers from Assemblée nationale open data.
 * Stores the original structure in mirror tables (dossiers_legislatifs, actes_legislatifs,
 * dossiers_initiateurs). The bills view is derived from dossiers_legislatifs.
 */

import { appendFileSync } from "fs";
import { supabase } from "./supabase";
import { dossiersClient } from "./dossiers-client";
import {
  AssembleeActesLegislatifs,
  AssembleeInitiateur
} from "./dossiers-types";

export interface IngestDossiersOptions {
  dryRun?: boolean;
  /** Legislature to ingest: "17", "16", or "all". Default "17". */
  legislature?: string;
}

interface FlatActe {
  ordre: number;
  parent_uid: string | null;
  uid: string | null;
  xsi_type: string | null;
  code_acte: string | null;
  libelle_nom_canonique: string | null;
  libelle_court: string | null;
  date_acte: string | null;
  organe_ref: string | null;
  texte_associe: string | null;
  texte_adopte: string | null;
}

function collectActes(
  actes: AssembleeActesLegislatifs | null | undefined,
  parentUid: string | null,
  out: FlatActe[],
  ordre: { n: number }
): void {
  const raw = actes?.acteLegislatif;
  if (raw == null) return;
  const list = Array.isArray(raw) ? raw : [raw];
  for (const a of list) {
    if (a == null) continue;
    const uid = a.uid ?? null;
    const lib = a.libelleActe;
    out.push({
      ordre: ordre.n++,
      parent_uid: parentUid,
      uid,
      xsi_type: a["@xsi:type"] ?? null,
      code_acte: a.codeActe ?? null,
      libelle_nom_canonique: lib?.nomCanonique ?? null,
      libelle_court: lib?.libelleCourt ?? null,
      date_acte: a.dateActe ?? null,
      organe_ref: a.organeRef ?? null,
      texte_associe: a.texteAssocie ?? null,
      texte_adopte: a.texteAdopte ?? null
    });
    if (a.actesLegislatifs?.acteLegislatif != null) {
      collectActes(
        { acteLegislatif: a.actesLegislatifs.acteLegislatif },
        uid,
        out,
        ordre
      );
    }
  }
}

function collectInitiateurs(initiateur: AssembleeInitiateur | null | undefined): { acteur_ref: string | null; mandat_ref: string | null }[] {
  const acteurs = initiateur?.acteurs?.acteur;
  if (acteurs == null) return [];
  const list = Array.isArray(acteurs) ? acteurs : [acteurs];
  return list.map((a) => ({
    acteur_ref: a?.acteurRef ?? null,
    mandat_ref: a?.mandatRef ?? null
  }));
}

/** Collect distinct texte refs for bill_texts: dossier uid (default) + all texte_associe/texte_adopte from actes. */
function collectTexteRefsForDossier(dossierUid: string, flatActes: FlatActe[]): string[] {
  const refs = new Set<string>();
  refs.add(dossierUid);
  for (const a of flatActes) {
    if (a.texte_associe?.trim()) refs.add(a.texte_associe.trim());
    if (a.texte_adopte?.trim()) refs.add(a.texte_adopte.trim());
  }
  return [...refs];
}

function safeJson(val: unknown): unknown {
  if (val === undefined) return null;
  return val;
}

const LOG_FILE = process.env.INGEST_LOG_FILE || "";
const log = (msg: string, ...args: unknown[]) => {
  const line = [new Date().toISOString(), msg, ...args].filter(Boolean).join(" ");
  console.log(line);
  if (LOG_FILE) {
    try {
      appendFileSync(LOG_FILE, line + "\n");
    } catch {
      // ignore
    }
  }
};

export async function ingestDossiers(
  options: IngestDossiersOptions = {}
): Promise<{ totalDossiers: number; totalActes: number; totalInitiateurs: number }> {
  const legislature = options.legislature ?? "17";
  log("[ingest-dossiers] Starting", { legislature, dryRun: options.dryRun });

  log("[ingest-dossiers] Fetching dossiers from open data ZIP...");
  const all = await dossiersClient.fetchAllDossiers(legislature);
  const dossiers =
    legislature === "all"
      ? all
      : all.filter((d) => String(d.legislature ?? "") === legislature);

  log("[ingest-dossiers] Fetched total:", all.length, "| filtered for legislature", legislature + ":", dossiers.length);
  if (dossiers.length === 0) {
    log("[ingest-dossiers] No dossiers to process. Exiting.");
    return { totalDossiers: 0, totalActes: 0, totalInitiateurs: 0 };
  }
  const first = dossiers[0];
  const firstActes = first?.actesLegislatifs?.acteLegislatif;
  const firstActesCount = firstActes == null ? 0 : Array.isArray(firstActes) ? firstActes.length : 1;
  log("[ingest-dossiers] First dossier sample:", first?.uid, "| titre length:", first?.titreDossier?.titre?.length ?? 0, "| root actes:", firstActesCount, "| initiateur:", first?.initiateur?.acteurs?.acteur ? "yes" : "no");

  let upserted = 0;
  let totalActes = 0;
  let totalInitiateurs = 0;
  let skippedNoUid = 0;
  let skippedNoTitre = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < dossiers.length; i += BATCH_SIZE) {
    const chunk = dossiers.slice(i, i + BATCH_SIZE);
    log("[ingest-dossiers] Processing batch", Math.floor(i / BATCH_SIZE) + 1, "| dossiers", i + 1, "-", Math.min(i + BATCH_SIZE, dossiers.length));
    for (const dossier of chunk) {
      const uid = dossier.uid?.trim();
      const titre = dossier.titreDossier?.titre?.trim();
      if (!uid) {
        skippedNoUid++;
        continue;
      }
      if (!titre) {
        skippedNoTitre++;
        continue;
      }

      if (options.dryRun) {
        log("[ingest-dossiers] Dry run - would upsert:", uid, titre.slice(0, 50) + "...");
        upserted++;
        continue;
      }

      const titreDossier = dossier.titreDossier;
      const procedure = dossier.procedureParlementaire;
      const row = {
        uid,
        legislature: dossier.legislature ?? null,
        xsi_type: dossier["@xsi:type"] ?? null,
        procedure_code: procedure?.code ?? null,
        procedure_libelle: procedure?.libelle ?? null,
        titre,
        titre_chemin: titreDossier?.titreChemin ?? null,
        senat_chemin: titreDossier?.senatChemin ?? null,
        fusion_dossier_uid:
          typeof dossier.fusionDossier === "string"
            ? dossier.fusionDossier
            : (dossier.fusionDossier as { uid?: string } | null)?.uid ?? null,
        plf: safeJson(dossier.PLF) as Record<string, unknown> | null,
        indexation: safeJson(dossier.indexation) as Record<string, unknown> | null
      };

      const { data: existing, error: selectError } = await supabase
        .from("dossiers_legislatifs")
        .select("id")
        .eq("uid", uid)
        .maybeSingle();
      if (selectError) log("[ingest-dossiers] Select existing error for", uid, selectError.message);

      const payload = existing ? { ...row, id: existing.id } : row;
      const { data: upsertedRow, error: upsertError } = await supabase
        .from("dossiers_legislatifs")
        .upsert(payload, { onConflict: "uid" })
        .select("id")
        .single();

      if (upsertError) {
        log("[ingest-dossiers] ERROR upserting dossier", uid, upsertError.message);
        continue;
      }
      const dossierId = upsertedRow.id as string;
      upserted++;
      if (upserted <= 3) log("[ingest-dossiers] Upserted dossier", upserted, uid, "-> id", dossierId);

      const initiateurs = collectInitiateurs(dossier.initiateur);
      if (initiateurs.length > 0) {
        const { error: delInit } = await supabase.from("dossiers_initiateurs").delete().eq("dossier_id", dossierId);
        if (delInit) log("[ingest-dossiers] Delete initiateurs error", uid, delInit.message);
        const { error: insInit } = await supabase.from("dossiers_initiateurs").insert(
          initiateurs.map((init, ordre) => ({
            dossier_id: dossierId,
            ordre,
            acteur_ref: init.acteur_ref,
            mandat_ref: init.mandat_ref
          }))
        );
        if (insInit) log("[ingest-dossiers] Insert initiateurs error", uid, insInit.message);
        else totalInitiateurs += initiateurs.length;
      }

      const flatActes: FlatActe[] = [];
      collectActes(dossier.actesLegislatifs ?? null, null, flatActes, { n: 0 });
      if (flatActes.length > 0) {
        const { error: delActes } = await supabase.from("actes_legislatifs").delete().eq("dossier_id", dossierId);
        if (delActes) log("[ingest-dossiers] Delete actes error", uid, delActes.message);
        const insertRows = flatActes.map((a) => ({
          dossier_id: dossierId,
          parent_uid: a.parent_uid,
          parent_id: null,
          ordre: a.ordre,
          uid: a.uid,
          xsi_type: a.xsi_type,
          code_acte: a.code_acte,
          libelle_nom_canonique: a.libelle_nom_canonique,
          libelle_court: a.libelle_court,
          date_acte: a.date_acte,
          organe_ref: a.organe_ref,
          texte_associe: a.texte_associe,
          texte_adopte: a.texte_adopte
        }));
        const { error: actesError } = await supabase.from("actes_legislatifs").insert(insertRows);
        if (actesError) {
          log("[ingest-dossiers] ERROR inserting actes for", uid, actesError.message);
        } else {
          totalActes += insertRows.length;
          if (totalActes <= 50) log("[ingest-dossiers] Inserted", insertRows.length, "actes for", uid);
          await resolveActesParentId(supabase, dossierId);
        }
      }

      // Bill textes (versions de texte): from dossier uid + actes (texte_associe, texte_adopte). At least one per dossier.
      if (!options.dryRun) {
        const texteRefs = collectTexteRefsForDossier(uid, flatActes);
        const billTextRows = texteRefs.map((texte_ref) => ({ bill_id: dossierId, texte_ref }));
        const { error: btError } = await supabase
          .from("bill_texts")
          .upsert(billTextRows, { onConflict: "bill_id,texte_ref", ignoreDuplicates: false });
        if (btError) log("[ingest-dossiers] bill_texts upsert error for", uid, btError.message);
      }
    }
    log("[ingest-dossiers] Batch done. Running totals: dossiers", upserted, "| actes", totalActes, "| initiateurs", totalInitiateurs);
  }

  log("[ingest-dossiers] Complete. Upserted:", upserted, "dossiers |", totalActes, "actes |", totalInitiateurs, "initiateurs. Skipped (no uid):", skippedNoUid, "| skipped (no titre):", skippedNoTitre);
  return { totalDossiers: upserted, totalActes, totalInitiateurs };
}

/** Resolve parent_id from parent_uid for a dossier's actes. */
async function resolveActesParentId(
  supabaseClient: typeof supabase,
  dossierId: string
): Promise<void> {
  const { data: actes } = await supabaseClient
    .from("actes_legislatifs")
    .select("id, uid, parent_uid")
    .eq("dossier_id", dossierId);
  if (!actes?.length) return;
  const byUid = new Map<string, string>();
  for (const a of actes) {
    if (a.uid != null) byUid.set(a.uid, a.id);
  }
  for (const a of actes) {
    const parentUid = (a as { parent_uid?: string | null }).parent_uid;
    if (!parentUid) continue;
    const parentId = byUid.get(parentUid);
    if (!parentId) continue;
    await supabaseClient.from("actes_legislatifs").update({ parent_id: parentId }).eq("id", a.id);
  }
}

// CLI: run when executed directly (npm run ingest:dossiers -- --legislature 17)
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: IngestDossiersOptions = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") options.dryRun = true;
    else if (args[i] === "--legislature" && args[i + 1]) {
      options.legislature = args[i + 1];
      i++;
    }
  }
  ingestDossiers(options)
    .then((r) => {
      log("[ingest-dossiers] Done.", r);
    })
    .catch((err) => {
      console.error("[ingest-dossiers] Fatal:", err);
      process.exit(1);
    });
}