/**
 * Transform AMO acteur data to deputy DB rows
 */

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

function firstMandatDepute(
  mandats: AssembleeMandat[] | undefined,
  _organesMap: Map<string, AssembleeOrgane>,
): {
  circonscription: string | null;
  departement: string | null;
  dateDebut: string | null;
  groupeRef: string | null;
} {
  if (!mandats?.length)
    return {
      circonscription: null,
      departement: null,
      dateDebut: null,
      groupeRef: null,
    };
  const mandatsList = toList(mandats);
  const deputeMandat =
    mandatsList.find(
      (m) => m.election?.refCirconscription || m.election?.lieu,
    ) ??
    mandatsList.find((m) =>
      (m.infosQualite?.libelleQualiteSex ?? "")
        .toLowerCase()
        .includes("député"),
    ) ??
    mandatsList[0];
  const gpMandat = mandatsList.find((m) => m.typeOrgane === "GP");
  if (!deputeMandat)
    return {
      circonscription: null,
      departement: null,
      dateDebut: null,
      groupeRef: null,
    };

  let circonscription: string | null = null;
  let departement: string | null = null;
  if (deputeMandat.election) {
    const lieu = deputeMandat.election.lieu;
    if (lieu) {
      departement = lieu.departement?.libelle ?? null;
      const numCirco = lieu.numCirco;
      const region = lieu.region?.libelle;
      if (departement && numCirco) {
        circonscription = `${departement} - ${numCirco}e circonscription`;
      } else if (departement) {
        circonscription = departement;
      } else if (region) {
        circonscription = region;
      }
    }
    if (!circonscription && deputeMandat.election.refCirconscription) {
      circonscription = deputeMandat.election.refCirconscription;
    }
  }

  const groupeRef =
    extractUid(gpMandat?.organeRef) ??
    extractUid(gpMandat?.organes?.organeRef) ??
    null;
  const dateDebut = deputeMandat.dateDebut ?? null;

  return { circonscription, departement, dateDebut, groupeRef };
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
  const { circonscription, departement, dateDebut, groupeRef } =
    firstMandatDepute(mandats, organesMap);
  const date_debut_mandat = dateDebut;

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
    departement,
    date_debut_mandat,
    legislature,
    official_url,
  };
}
