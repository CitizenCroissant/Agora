/**
 * Campaign themes and keyword-based tagging for agenda items (e.g. election hub).
 * Used by the API to add campaign_topics to AgendaItem when building responses.
 */

import type { CampaignTopic } from "./types";

export interface CampaignThemeConfig {
  slug: string;
  label: string;
  /** Lowercase keywords; accents normalized for matching */
  keywords: string[];
}

const CAMPAIGN_THEMES: CampaignThemeConfig[] = [
  {
    slug: "pouvoir-achat",
    label: "Pouvoir d'achat & économie",
    keywords: [
      "pouvoir d'achat",
      "budget",
      "fiscalité",
      "impôt",
      "taxe",
      "aides",
      "revenus",
      "salaire",
      "retraite",
      "allocations",
      "prestations",
      "dépenses publiques",
      "loi de finances",
      "plf",
      "fraudes sociales",
      "fraudes fiscales"
    ]
  },
  {
    slug: "climat",
    label: "Climat & environnement",
    keywords: [
      "climat",
      "environnement",
      "transition énergétique",
      "énergie",
      "renouvelable",
      "nucléaire",
      "carbone",
      "biodiversité",
      "pollution",
      "eau",
      "déchets",
      "transport",
      "aménagement durable"
    ]
  },
  {
    slug: "sante",
    label: "Santé",
    keywords: [
      "santé",
      "hôpital",
      "hopital",
      "médecine",
      "pharmacie",
      "prévention",
      "assurance maladie",
      "sécurité sociale"
    ]
  },
  {
    slug: "education",
    label: "Éducation",
    keywords: [
      "éducation",
      "école",
      "enseignement",
      "université",
      "lycée",
      "collège",
      "formation",
      "recherche"
    ]
  },
  {
    slug: "securite",
    label: "Sécurité & institutions",
    keywords: [
      "sécurité",
      "police",
      "justice",
      "libertés publiques",
      "institutions",
      "réforme de l'état",
      "défense",
      "intérieur"
    ]
  },
  {
    slug: "travail",
    label: "Travail & emploi",
    keywords: [
      "travail",
      "emploi",
      "chômage",
      "contrat",
      "code du travail",
      "dialogue social"
    ]
  }
];

/** Normalize text for keyword matching: lowercase, strip accents */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\u0301/g, "")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Returns campaign topics whose keywords match the given title or description.
 * Used to tag agenda items for the election hub / "sujet de campagne" badges.
 */
export function getCampaignTopicsForAgendaItem(
  title?: string | null,
  description?: string | null
): CampaignTopic[] {
  const combined = [title, description].filter(Boolean).join(" ") || "";
  if (!combined.trim()) return [];

  const normalized = normalizeForMatch(combined);
  const matched: CampaignTopic[] = [];

  for (const theme of CAMPAIGN_THEMES) {
    const hasMatch = theme.keywords.some((kw) => {
      const kwNorm = normalizeForMatch(kw);
      return normalized.includes(kwNorm);
    });
    if (hasMatch) {
      matched.push({ slug: theme.slug, label: theme.label });
    }
  }

  return matched;
}
