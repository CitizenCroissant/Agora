import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/url";

const SITE_NAME = "Agora - Assemblée nationale";

export const metadata: Metadata = {
  title: `Dossiers législatifs | ${SITE_NAME}`,
  description:
    "Projets et propositions de loi à l'Assemblée nationale. Parcourez les dossiers législatifs en cours et suivez leur parcours.",
  openGraph: {
    title: `Dossiers législatifs – Projets et propositions de loi | ${SITE_NAME}`,
    description:
      "Projets et propositions de loi à l'Assemblée nationale. Parcourez les dossiers législatifs sur Agora.",
    type: "website",
    url: `${getBaseUrl()}/bills`,
    siteName: SITE_NAME,
    locale: "fr_FR"
  },
  twitter: {
    card: "summary_large_image",
    title: `Dossiers législatifs | ${SITE_NAME}`,
    description: "Projets et propositions de loi à l'Assemblée nationale – Agora."
  },
  alternates: { canonical: `${getBaseUrl()}/bills` }
};

export default function BillsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
