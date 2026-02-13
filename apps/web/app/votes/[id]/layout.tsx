import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/url";
import { apiClient } from "@/lib/api";
import { formatDate } from "@agora/shared";

const SITE_NAME = "Agora - Assemblée nationale";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const scrutin = await apiClient.getScrutin(id);
    const title =
      scrutin.titre.length > 60 ? scrutin.titre.slice(0, 57) + "…" : scrutin.titre;
    const pour = scrutin.synthese_pour;
    const contre = scrutin.synthese_contre;
    const quotePart =
      scrutin.sort_code === "adopté"
        ? `Adopté à ${pour} voix`
        : `Rejeté (${pour} pour, ${contre} contre)`;
    const quote = `Scrutin n°${scrutin.numero} – ${quotePart} – ${formatDate(scrutin.date_scrutin)}. ${title}`;
    const description = quote.length > 160 ? quote.slice(0, 157) + "…" : quote;
    const url = `${getBaseUrl()}/votes/${id}`;

    return {
      title: `${title} | ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${title} | ${SITE_NAME}`,
        description,
        type: "website",
        url,
        siteName: SITE_NAME,
        locale: "fr_FR"
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | ${SITE_NAME}`,
        description
      },
      alternates: { canonical: url }
    };
  } catch {
    return {
      title: `Scrutin | ${SITE_NAME}`,
      description: `Détail du scrutin – ${SITE_NAME}`
    };
  }
}

export default function VoteIdLayout({ children }: Props) {
  return <>{children}</>;
}
