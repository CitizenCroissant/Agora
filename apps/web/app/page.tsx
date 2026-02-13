import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

const SITE_NAME = "Agora - Assemblée nationale";

export const metadata: Metadata = {
  title: `Aujourd'hui | ${SITE_NAME}`,
  description:
    "Consultez l'agenda du jour à l'Assemblée nationale : séances publiques, réunions de commissions. Données officielles, accessibles et transparentes.",
  openGraph: {
    title: `L'agenda du jour | ${SITE_NAME}`,
    description:
      "Découvrez l'agenda du jour à l'Assemblée nationale sur Agora – séances et réunions.",
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR"
  },
  twitter: {
    card: "summary_large_image",
    title: `L'agenda du jour | ${SITE_NAME}`,
    description: "Agenda du jour à l'Assemblée nationale – Agora."
  }
};

export default function Home() {
  return <HomePageClient />;
}
