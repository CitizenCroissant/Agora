/**
 * Transform Assemblée nationale scrutin data to our domain model
 */

import {
  AssembleeScrutin,
  AssembleeGroupeVote,
  AssembleeVotant,
  ScrutinInsert,
  ScrutinVoteInsert
} from "./scrutins-types";

const SCRUTIN_OFFICIAL_URL_BASE =
  "https://www.assemblee-nationale.fr/dyn/16/scrutins";

/**
 * Transform a raw scrutin to our insert shape
 */
export function transformScrutin(
  raw: AssembleeScrutin,
  sittingId: string | null
): ScrutinInsert {
  const decompte = raw.syntheseVote?.decompte ?? {};
  const sortCode = (raw.sort?.code ?? "inconnu").toLowerCase();
  const normalizedSort =
    sortCode === "adopté" || sortCode === "rejeté" ? sortCode : "adopté";

  const objetLibelle =
    typeof raw.objet?.libelle === "string" && raw.objet.libelle.trim()
      ? raw.objet.libelle.trim()
      : null;
  const demandeurTexte =
    typeof raw.demandeur?.texte === "string" && raw.demandeur.texte.trim()
      ? raw.demandeur.texte.trim()
      : null;

  return {
    official_id: raw.uid,
    sitting_id: sittingId,
    date_scrutin: raw.dateScrutin ?? "",
    numero: raw.numero ?? raw.uid,
    type_vote_code: raw.typeVote?.codeTypeVote ?? null,
    type_vote_libelle: raw.typeVote?.libelleTypeVote ?? null,
    sort_code: normalizedSort,
    sort_libelle: raw.sort?.libelle ?? null,
    titre: raw.titre ?? raw.objet?.libelle ?? "Scrutin",
    synthese_pour: parseInt(decompte.pour ?? "0", 10) || 0,
    synthese_contre: parseInt(decompte.contre ?? "0", 10) || 0,
    synthese_abstentions: parseInt(decompte.abstentions ?? "0", 10) || 0,
    synthese_non_votants:
      parseInt(decompte.nonVotants ?? "0", 10) +
        parseInt(decompte.nonVotantsVolontaires ?? "0", 10) || 0,
    official_url: `${SCRUTIN_OFFICIAL_URL_BASE}/${raw.numero ?? raw.uid}`,
    objet_libelle: objetLibelle,
    demandeur_texte: demandeurTexte
  };
}

/**
 * Extract per-deputy votes from ventilationVotes
 */
export function extractScrutinVotes(
  raw: AssembleeScrutin,
  scrutinId: string
): ScrutinVoteInsert[] {
  const votes: ScrutinVoteInsert[] = [];
  const seen = new Set<string>();

  const groupes =
    raw.ventilationVotes?.organe?.groupes?.groupe ??
    ([] as AssembleeGroupeVote[]);
  const list = Array.isArray(groupes) ? groupes : [groupes];

  for (const groupe of list) {
    const nominatif = groupe.vote?.decompteNominatif;
    if (!nominatif) continue;

    const add = (
      acteurRef: string,
      position: ScrutinVoteInsert["position"]
    ) => {
      if (!acteurRef || seen.has(acteurRef)) return;
      seen.add(acteurRef);
      votes.push({ scrutin_id: scrutinId, acteur_ref: acteurRef, position });
    };

    const toList = (
      v: AssembleeVotant | AssembleeVotant[] | null | undefined
    ) => (v == null ? [] : Array.isArray(v) ? v : [v]);

    toList(nominatif.pours?.votant).forEach((v) => add(v.acteurRef, "pour"));
    toList(nominatif.contres?.votant).forEach((v) =>
      add(v.acteurRef, "contre")
    );
    toList(nominatif.abstentions?.votant).forEach((v) =>
      add(v.acteurRef, "abstention")
    );
    toList(nominatif.nonVotants?.votant).forEach((v) =>
      add(v.acteurRef, "non_votant")
    );
  }

  return votes;
}
