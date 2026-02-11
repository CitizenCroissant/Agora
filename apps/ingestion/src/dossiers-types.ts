/**
 * Minimal types for Assemblée nationale Dossiers_Legislatifs JSON.
 * We only model the fields we actually use for ingestion.
 */

export interface AssembleeDossierWrapper {
  dossierParlementaire: AssembleeDossierParlementaire;
}

export interface AssembleeDossierParlementaire {
  uid: string;
  legislature?: string;
  titreDossier?: {
    titre?: string;
    titreChemin?: string | null;
    senatChemin?: string | null;
  };
  procedureParlementaire?: {
    code?: string;
    libelle?: string;
  };
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

