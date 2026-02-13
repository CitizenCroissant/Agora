import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/url";

const SITE_NAME = "Agora - Assemblée nationale";

export const metadata: Metadata = {
  title: `Prochains votes | ${SITE_NAME}`,
  description:
    "Prochains scrutins prévus à l'Assemblée nationale. Découvrez les points susceptibles de donner lieu à un vote dans les prochains jours.",
  openGraph: {
    title: `Prochains votes | ${SITE_NAME}`,
    description:
      "Prochains scrutins à l'Assemblée nationale – suivez l'activité parlementaire sur Agora.",
    type: "website",
    url: `${getBaseUrl()}/votes/upcoming`,
    siteName: SITE_NAME,
    locale: "fr_FR"
  },
  twitter: {
    card: "summary_large_image",
    title: `Prochains votes | ${SITE_NAME}`,
    description: "Prochains votes à l'Assemblée nationale – Agora."
  },
  alternates: { canonical: `${getBaseUrl()}/votes/upcoming` }
};

export default function UpcomingVotesLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
