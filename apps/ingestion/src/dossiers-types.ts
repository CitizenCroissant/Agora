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

