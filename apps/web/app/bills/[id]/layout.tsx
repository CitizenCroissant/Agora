import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/url";
import { apiClient } from "@/lib/api";

const SITE_NAME = "Agora - Assemblée nationale";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const bill = await apiClient.getBill(id);
    const shortTitle = bill.short_title || bill.title;
    const title =
      shortTitle.length > 60 ? shortTitle.slice(0, 57) + "…" : shortTitle;
    const description =
      bill.title !== shortTitle
        ? `${bill.title.slice(0, 157)}… – ${SITE_NAME}`
        : `Texte législatif – ${SITE_NAME}`;
    const url = `${getBaseUrl()}/bills/${id}`;

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
      title: `Texte | ${SITE_NAME}`,
      description: `Détail du texte – ${SITE_NAME}`
    };
  }
}

export default function BillIdLayout({ children }: Props) {
  return <>{children}</>;
}
