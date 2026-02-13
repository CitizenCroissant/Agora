import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/url";
import { apiClient } from "@/lib/api";

const SITE_NAME = "Agora - Assemblée nationale";

type Props = {
  params: Promise<{ acteurRef: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { acteurRef } = await params;
  try {
    const deputy = await apiClient.getDeputy(acteurRef);
    const displayName = `${deputy.civil_prenom} ${deputy.civil_nom}`.trim();
    const title = displayName || "Député";
    const description = deputy.groupe_politique
      ? `${title}, ${deputy.groupe_politique} – Fiche sur Agora, l'Assemblée nationale en clair.`
      : `Fiche du député ${title} – ${SITE_NAME}`;
    const url = `${getBaseUrl()}/deputy/${encodeURIComponent(acteurRef)}`;

    return {
      title: `${title} | ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${title} | ${SITE_NAME}`,
        description,
        type: "profile",
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
      title: `Député | ${SITE_NAME}`,
      description: `Fiche député – ${SITE_NAME}`
    };
  }
}

export default function DeputyLayout({ children }: Props) {
  return <>{children}</>;
}
