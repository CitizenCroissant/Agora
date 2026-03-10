/**
 * Types for Assemblée nationale Dossiers_Legislatifs JSON.
 * Mirrors the original export structure so we can store it relationally without loss.
 */

export interface AssembleeDossierWrapper {
  dossierParlementaire: AssembleeDossierParlementaire;
}

/** One acte in the actesLegislatifs tree (recursive). */
export interface AssembleeActeLegislatif {
  "@xsi:type"?: string;
  uid?: string;
  codeActe?: string;
  libelleActe?: {
    nomCanonique?: string;
    libelleCourt?: string;
  };
  dateActe?: string | null;
  organeRef?: string | null;
  actesLegislatifs?: AssembleeActesLegislatifs | null;
  texteAssocie?: string | null;
  texteAdopte?: string | null;
}

/** Wrapper: acteLegislatif can be one object or array. */
export interface AssembleeActesLegislatifs {
  acteLegislatif?: AssembleeActeLegislatif | AssembleeActeLegislatif[] | null;
}

/** One initiator actor (acteurRef + mandatRef). */
export interface AssembleeInitiateurActeur {
  acteurRef?: string;
  mandatRef?: string;
}

export interface AssembleeInitiateur {
  acteurs?: {
    acteur?: AssembleeInitiateurActeur | AssembleeInitiateurActeur[];
  };
}

export interface AssembleeDossierParlementaire {
  uid: string;
  legislature?: string;
  "@xmlns"?: string;
  "@xmlns:xsi"?: string;
  "@xsi:type"?: string;
  titreDossier?: {
    titre?: string;
    titreChemin?: string | null;
    senatChemin?: string | null;
  };
  procedureParlementaire?: {
    code?: string;
    libelle?: string;
  };
  actesLegislatifs?: AssembleeActesLegislatifs | null;
  initiateur?: AssembleeInitiateur | null;
  fusionDossier?: unknown | null;
  PLF?: unknown;
  indexation?: unknown;
}

/**
 * Legislature 14 uses a single JSON file: export.textesLegislatifs.document[].
 * Each document has dossierRef, titres.titrePrincipal; we group by dossierRef to get one dossier per bill.
 */
export interface DossiersXIVExport {
  export?: {
    textesLegislatifs?: {
      document?: DossiersXIVDocument | DossiersXIVDocument[];
    };
  };
}

export interface DossiersXIVDocument {
  dossierRef?: string;
  legislature?: string | null;
  denominationStructurelle?: string;
  titres?: {
    titrePrincipal?: string;
    titrePrincipalCourt?: string;
  };
  classification?: {
    type?: { code?: string; libelle?: string };
  };
}
