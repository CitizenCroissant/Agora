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
    const organe = await apiClient.getCommission(id);
    const title = organe.libelle ?? organe.libelle_abrege ?? id;
    const description = `Commission : ${title}. Réunions et membres – ${SITE_NAME}`;
    const url = `${getBaseUrl()}/commissions/${encodeURIComponent(id)}`;

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
      title: `Commission | ${SITE_NAME}`,
      description: `Commission – ${SITE_NAME}`
    };
  }
}

export default function CommissionLayout({ children }: Props) {
  return <>{children}</>;
}
