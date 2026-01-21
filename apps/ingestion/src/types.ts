/**
 * Types for Assemblée nationale data
 */

// Official API response types from data.assemblee-nationale.fr
export interface AssembleeReunionWrapper {
  reunion: AssembleeReunion;
}

export interface AssembleeReunion {
  '@xsi:type': string; // 'seance_type' or 'reunionCommission_type'
  uid: string;
  timeStampDebut?: string; // ISO datetime
  timeStampFin?: string; // ISO datetime
  lieu?: {
    lieuRef: string;
    libelleLong: string;
  };
  cycleDeVie: {
    etat: string; // 'Confirmé', 'Supprimé'
    chrono: {
      creation: string;
      cloture: string | null;
    };
  };
  organeReuniRef: string;
  sessionRef?: string;
  ODJ: {
    convocationODJ: { item: string } | null;
    resumeODJ: { item: string } | null;
    pointsODJ: {
      pointODJ: AssembleePointODJ | AssembleePointODJ[];
    } | null;
  };
  identifiants?: {
    DateSeance?: string; // YYYY-MM-DD+TZ
    numSeanceJO?: string | null;
    idJO?: string | null;
    quantieme?: string;
  };
  compteRenduRef?: string | null;
}

export interface AssembleePointODJ {
  '@xsi:type': string;
  uid: string;
  cycleDeVie: {
    etat: string;
    chrono: {
      creation: string;
      cloture: string | null;
    };
  };
  objet: string;
  typePointODJ: string;
  dossiersLegislatifsRefs?: {
    dossierRef: string | string[];
  } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textesAssocies?: any;
  natureTravauxODJ?: string;
}

// Legacy types for backwards compatibility
export interface AssembleeSeance {
  uid: string;
  legislature: number;
  dateSeance: string; // YYYY-MM-DD
  heureDebut?: string;
  heureFin?: string;
  typeSeance: string;
  intitule: string;
  organeRef: string;
  lieuLibelle?: string;
  pointsOdj?: AssembleePointOdj[];
}

export interface AssembleePointOdj {
  numero?: number;
  intitule: string;
  nature?: string;
  texteRef?: string;
  heureDebut?: string;
}

// Database insert types
export interface SittingInsert {
  official_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  type: string;
  title: string;
  description: string;
  location?: string;
}

export interface AgendaItemInsert {
  sitting_id: string;
  scheduled_time?: string;
  title: string;
  description: string;
  category: string;
  reference_code?: string;
  official_url?: string;
}

export interface SourceMetadataInsert {
  sitting_id: string;
  original_source_url: string;
  last_synced_at: string;
  checksum: string;
}
