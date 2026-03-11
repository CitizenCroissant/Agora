import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getBaseUrl } from "@/lib/url";
import ElectionHubClient from "./ElectionHubClient";

export const metadata: Metadata = {
  title: "Élections 2026 | Agora - Séances clés à l'Assemblée nationale",
  description:
    "Suivez les séances clés de l'Assemblée nationale avant les élections de 2026 : calendrier des prochaines séances et thèmes de campagne.",
  openGraph: {
    title: "Élections 2026 | Agora",
    description:
      "Les prochaines séances à l'Assemblée nationale en lien avec les grands thèmes de la campagne.",
    type: "website"
  },
  alternates: { canonical: `${getBaseUrl()}/elections-2026` }
};

export default function Elections2026Page() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Élections 2026" }
        ]}
      />
      <ElectionHubClient />
    </div>
  );
}

