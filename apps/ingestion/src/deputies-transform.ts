/**
 * Transform AMO acteur data to deputy DB rows
 */

import {
  resolveCirconscriptionName,
  circonscriptionRefCanonical,
  circonscriptionId,
} from "@agora/shared";
import {
  AssembleeMandat,
  AssembleeOrgane,
  DeputyInsert,
} from "./deputies-types";
import { DeputyWithOrganes } from "./deputies-client";

function toList<T>(x: T | T[] | null | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

/** Extract acteur UID - AMO30 has uid as { "#text": "PA123" }, AMO10 has plain string */
function extractUid(uid: unknown): string | null {
  if (typeof uid === "string" && uid.trim()) return uid.trim();
  if (uid && typeof uid === "object" && "#text" in uid) {
    const t = (uid as { "#text"?: unknown })["#text"];
    return typeof t === "string" && t.trim() ? t.trim() : null;
  }
  return null;
}

const todayIso = () => new Date().toISOString().split("T")[0];

function firstMandatDepute(
  mandats: AssembleeMandat[] | undefined,
  _organesMap: Map<string, AssembleeOrgane>,
): {
  circonscription: string | null;
  ref_circonscription: string | null;
  departement: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  groupeRef: string | null;
} {
  if (!mandats?.length)
    return {
      circonscription: null,
      ref_circonscription: null,
      departement: null,
      dateDebut: null,
      dateFin: null,
      groupeRef: null,
    };
  const mandatsList = toList(mandats);
  // Restrict to Assemblée nationale (député) mandats only, so we don't pick a
  // current Sénat or other organe mandat (e.g. PA267075 is a former député, current sénateur).
  const assembleeMandats = mandatsList.filter(
    (m) =>
      m.typeOrgane === "ASSEMBLEE" &&
      (m.election?.refCirconscription || m.election?.lieu),
  );
  const deputeMandats =
    assembleeMandats.length > 0
      ? assembleeMandats
      : mandatsList.filter(
          (m) =>
            m.election?.refCirconscription ||
            m.election?.lieu ||
            (m.infosQualite?.libelleQualiteSex ?? "")
              .toLowerCase()
              .includes("député"),
        );
  const deputeMandatsList =
    deputeMandats.length > 0 ? deputeMandats : mandatsList;
  const today = todayIso();
  const isCurrent = (m: AssembleeMandat) =>
    !m.dateFin || m.dateFin.split("T")[0] >= today;
  const deputeMandat =
    deputeMandatsList.find((m) => isCurrent(m)) ??
    [...deputeMandatsList].sort((a, b) => {
      const endA = a.dateFin?.split("T")[0] ?? "";
      const endB = b.dateFin?.split("T")[0] ?? "";
      return endB.localeCompare(endA);
    })[0];
  const gpMandatRes = mandatsList.find((m) => m.typeOrgane === "GP");

  if (!deputeMandat)
    return {
      circonscription: null,
      ref_circonscription: null,
      departement: null,
      dateDebut: null,
      dateFin: null,
      groupeRef: null,
    };

  function fromElection(election: AssembleeMandat["election"]): {
    circonscription: string | null;
    refCirconscription: string | null;
    departement: string | null;
  } {
    if (!election)
      return {
        circonscription: null,
        refCirconscription: null,
        departement: null,
      };
    let c: string | null = null;
    let d: string | null = null;
    const refCirconscription =
      typeof election.refCirconscription === "string"
        ? election.refCirconscription.trim() || null
        : null;
    const lieu = election.lieu;
    if (lieu) {
      // AMO30: lieu.departement is string; AMO10: lieu.departement.libelle
      const deptVal = lieu.departement;
      d =
        typeof deptVal === "string"
          ? deptVal.trim() || null
          : (deptVal?.libelle?.trim() ?? null);
      const numCirco = lieu.numCirco?.trim();
      const regionVal = lieu.region;
      const region =
        typeof regionVal === "string"
          ? regionVal.trim()
          : regionVal?.libelle?.trim();
      if (d && numCirco) {
        c = `${d} - ${numCirco}e circonscription`;
      } else if (d) {
        c = d;
      } else if (region) {
        c = region;
      }
    }
    // Prefer lieu-derived name; use refCirconscription only when lieu had no usable data
    if (!c && refCirconscription) {
      c = resolveCirconscriptionName(refCirconscription) ?? refCirconscription;
    }
    return {
      circonscription: c,
      refCirconscription,
      departement: d,
    };
  }

  let { circonscription, refCirconscription, departement } = fromElection(
    deputeMandat.election,
  );

  // If primary mandat has no circonscription, take from any mandat that has it (e.g. current mandat may lack election data)
  if (!circonscription || !refCirconscription) {
    for (const m of deputeMandatsList) {
      if (m === deputeMandat) continue;
      const fallback = fromElection(m.election);
      if (fallback.circonscription) {
        circonscription = circonscription ?? fallback.circonscription;
        refCirconscription = refCirconscription ?? fallback.refCirconscription;
        if (fallback.departement)
          departement = departement ?? fallback.departement;
        break;
      }
    }
  }
  if (!circonscription || !refCirconscription) {
    for (const m of mandatsList) {
      const fallback = fromElection(m.election);
      if (fallback.circonscription) {
        circonscription = circonscription ?? fallback.circonscription;
        refCirconscription = refCirconscription ?? fallback.refCirconscription;
        if (fallback.departement)
          departement = departement ?? fallback.departement;
        break;
      }
    }
  }

  const ref_circonscription =
    circonscriptionRefCanonical(refCirconscription ?? null) ??
    (circonscription ? circonscriptionId(circonscription) : null);

  const groupeRef =
    extractUid(gpMandatRes?.organeRef) ??
    extractUid(gpMandatRes?.organes?.organeRef) ??
    null;
  const dateDebut = deputeMandat.dateDebut ?? null;
  const dateFin =
    typeof deputeMandat.dateFin === "string"
      ? deputeMandat.dateFin.split("T")[0]
      : null;

  return {
    circonscription,
    ref_circonscription,
    departement,
    dateDebut,
    dateFin,
    groupeRef,
  };
}

export function transformDeputy(item: DeputyWithOrganes): DeputyInsert | null {
  const { acteur, organesMap } = item;
  const uid = extractUid(acteur.uid);
  if (!uid) return null;

  const ident = acteur.etatCivil?.ident as
    | { nom?: unknown; prenom?: unknown }
    | undefined;
  const nom = typeof ident?.nom === "string" ? ident.nom.trim() : "";
  const prenom = typeof ident?.prenom === "string" ? ident.prenom.trim() : "";
  if (!nom && !prenom) return null;

  const infoNais = acteur.etatCivil?.infoNaissance as
    | { dateNais?: string; lieuNais?: unknown }
    | undefined;
  const dateNaissance =
    typeof infoNais?.dateNais === "string"
      ? infoNais.dateNais.split("T")[0]
      : null;
  const lieuNaissance =
    typeof infoNais?.lieuNais === "string" ? infoNais.lieuNais.trim() : null;
  const professionRaw = (
    acteur.profession as { libelleCourant?: unknown } | undefined
  )?.libelleCourant;
  const profession =
    typeof professionRaw === "string" ? professionRaw.trim() || null : null;
  const sexe = typeof acteur.sexe === "string" ? acteur.sexe.trim() : null;

  const mandats = toList(acteur.mandats?.mandat);
  const {
    circonscription,
    ref_circonscription,
    departement,
    dateDebut,
    dateFin,
    groupeRef,
  } = firstMandatDepute(mandats, organesMap);
  const date_debut_mandat = dateDebut;
  const date_fin_mandat = dateFin;

  let groupe_politique: string | null = null;
  if (groupeRef) {
    const org = organesMap.get(groupeRef);
    groupe_politique = org?.libelleAbrege ?? org?.libelle ?? null;
  }

  const official_url = `https://www.assemblee-nationale.fr/dyn/deputes/${uid}`;
  const legislature = 17;

  return {
    acteur_ref: uid,
    civil_nom: nom || "Inconnu",
    civil_prenom: prenom || "Inconnu",
    date_naissance: dateNaissance,
    lieu_naissance: lieuNaissance,
    profession,
    sexe,
    parti_politique: null,
    groupe_politique,
    circonscription,
    ref_circonscription,
    departement,
    date_debut_mandat,
    date_fin_mandat,
    legislature,
    official_url,
  };
}
