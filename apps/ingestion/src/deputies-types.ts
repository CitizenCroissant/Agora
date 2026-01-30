/**
 * Raw types for Assemblée nationale AMO acteurs (deputies) JSON
 * Schema: data.assemblee-nationale.fr AMO10_deputes_actifs_mandats_actifs_organes
 */

export interface AssembleeActeur {
  uid?: string;
  etatCivil?: {
    ident?: { nom?: string; prenom?: string };
    infoNaissance?: { dateNais?: string; lieuNais?: string };
    dateDeces?: string;
  };
  profession?: { libelleCourant?: string };
  sexe?: string;
  mandats?: {
    mandat?: AssembleeMandat | AssembleeMandat[];
  };
}

export interface AssembleeMandat {
  uid?: string;
  typeOrgane?: string;
  /** Top-level ref (some exports) */
  organeRef?: string;
  /** Nested ref (AMO10/AMO30: mandat.organes.organeRef) */
  organes?: { organeRef?: string };
  dateDebut?: string;
  dateFin?: string;
  election?: {
    lieu?: {
      region?: { libelle?: string };
      departement?: { libelle?: string };
      numCirco?: string;
    };
    refCirconscription?: string;
  };
  infosQualite?: {
    libelleQualiteSex?: string;
  };
}

export interface AssembleeOrgane {
  uid?: string;
  libelleAbrege?: string;
  libelle?: string;
  typeOrgane?: string;
}

export interface DeputyInsert {
  acteur_ref: string;
  civil_nom: string;
  civil_prenom: string;
  date_naissance: string | null;
  lieu_naissance: string | null;
  profession: string | null;
  sexe: string | null;
  parti_politique: string | null;
  groupe_politique: string | null;
  circonscription: string | null;
  departement: string | null;
  date_debut_mandat: string | null;
  legislature: number | null;
  official_url: string | null;
}
