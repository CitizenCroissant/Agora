import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/url";

const SITE_NAME = "Agora - Assemblée nationale";

export const metadata: Metadata = {
  title: `Commissions et organes | ${SITE_NAME}`,
  description:
    "Commissions permanentes, commissions d'enquête, délégations et autres organes de travail de l'Assemblée nationale.",
  openGraph: {
    title: `Commissions et organes | ${SITE_NAME}`,
    description:
      "Commissions permanentes, commissions d'enquête et organes de l'Assemblée nationale – Agora.",
    type: "website",
    url: `${getBaseUrl()}/commissions`,
    siteName: SITE_NAME,
    locale: "fr_FR"
  },
  twitter: {
    card: "summary_large_image",
    title: `Commissions et organes | ${SITE_NAME}`,
    description: "Commissions et organes de l'Assemblée nationale – Agora."
  },
  alternates: { canonical: `${getBaseUrl()}/commissions` }
};

export default function CommissionsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
