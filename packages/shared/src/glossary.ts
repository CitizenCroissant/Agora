/**
 * Glossary of parliamentary terms used in Agora.
 * Content is intentionally short and neutral.
 */

export interface GlossaryEntry {
  id: string;
  term: string;
  shortDefinition: string;
  longDefinition?: string;
}

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    id: "scrutin-public-ordinaire",
    term: "scrutin public ordinaire",
    shortDefinition:
      "Vote nominal où chaque député vote publiquement sur un texte ou un article."
  },
  {
    id: "scrutin-public-solennel",
    term: "scrutin public solennel",
    shortDefinition:
      "Vote public organisé dans un format solennel, souvent sur des textes importants."
  },
  {
    id: "scrutin",
    term: "scrutin",
    shortDefinition:
      "Vote formel des députés sur un texte, un article ou une motion."
  },
  {
    id: "seance-publique",
    term: "séance publique",
    shortDefinition:
      "Réunion de l’Assemblée nationale ouverte au public et retransmise."
  },
  {
    id: "premiere-lecture",
    term: "première lecture",
    shortDefinition:
      "Première étape de l’examen d’un texte par une assemblée (Assemblée nationale ou Sénat)."
  }
];

export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
  const normalized = term.trim().toLowerCase();
  return GLOSSARY_ENTRIES.find(
    (entry) => entry.term.toLowerCase() === normalized
  );
}

