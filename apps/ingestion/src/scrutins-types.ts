/**
 * Raw types for Assemblée nationale Scrutins JSON
 * Schema: docs/SCRUTINS_SCHEMA.md
 */

export interface ScrutinWrapper {
  scrutin: AssembleeScrutin;
}

export interface AssembleeScrutin {
  uid: string;
  numero: string;
  organeRef?: string;
  legislature?: string;
  sessionRef?: string;
  seanceRef?: string;
  dateScrutin: string;
  quantiemeJourSeance?: string;
  typeVote?: {
    codeTypeVote?: string;
    libelleTypeVote?: string;
    typeMajorite?: string;
  };
  sort?: {
    code?: string;
    libelle?: string;
  };
  titre?: string;
  demandeur?: { texte?: string; referenceLegislative?: string | null };
  objet?: {
    libelle?: string;
    dossierLegislatif?: string | null;
    referenceLegislative?: string | null;
  };
  syntheseVote?: {
    nombreVotants?: string;
    suffragesExprimes?: string;
    nbrSuffragesRequis?: string;
    annonce?: string;
    decompte?: {
      nonVotants?: string;
      pour?: string;
      contre?: string;
      abstentions?: string;
      nonVotantsVolontaires?: string;
    };
  };
  ventilationVotes?: {
    organe?: {
      organeRef?: string;
      groupes?: {
        groupe?: AssembleeGroupeVote | AssembleeGroupeVote[];
      };
    };
  };
  lieuVote?: string;
}

export interface AssembleeGroupeVote {
  organeRef: string;
  nombreMembresGroupe?: string;
  vote?: {
    positionMajoritaire?: string;
    decompteVoix?: Record<string, string>;
    decompteNominatif?: {
      nonVotants?: { votant?: AssembleeVotant | AssembleeVotant[] } | null;
      pours?: { votant?: AssembleeVotant | AssembleeVotant[] } | null;
      contres?: { votant?: AssembleeVotant | AssembleeVotant[] } | null;
      abstentions?: { votant?: AssembleeVotant | AssembleeVotant[] } | null;
    };
  };
}

export interface AssembleeVotant {
  acteurRef: string;
  mandatRef?: string;
  parDelegation?: string;
  numPlace?: string;
  causePositionVote?: string;
}

export interface ScrutinInsert {
  official_id: string;
  sitting_id: string | null;
  date_scrutin: string;
  numero: string;
  type_vote_code: string | null;
  type_vote_libelle: string | null;
  sort_code: string;
  sort_libelle: string | null;
  titre: string;
  synthese_pour: number;
  synthese_contre: number;
  synthese_abstentions: number;
  synthese_non_votants: number;
  official_url: string | null;
}

export interface ScrutinVoteInsert {
  scrutin_id: string;
  acteur_ref: string;
  position: "pour" | "contre" | "abstention" | "non_votant";
}
