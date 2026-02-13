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
    const sitting = await apiClient.getSitting(id);
    const title = sitting.title.length > 60 ? sitting.title.slice(0, 57) + "…" : sitting.title;
    const description =
      sitting.description && sitting.description !== sitting.title
        ? sitting.description.slice(0, 160) + (sitting.description.length > 160 ? "…" : "")
        : `Séance du ${formatDate(sitting.date)} – ${SITE_NAME}`;
    const url = `${getBaseUrl()}/sitting/${id}`;

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
      title: `Séance | ${SITE_NAME}`,
      description: `Détail de la séance – ${SITE_NAME}`
    };
  }
}

export default function SittingIdLayout({ children }: Props) {
  return <>{children}</>;
}
