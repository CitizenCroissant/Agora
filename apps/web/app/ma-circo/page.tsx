import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import MaCircoClient from "./MaCircoClient";
import { getBaseUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "Ma circonscription | Agora - Trouver ma zone et suivre les séances",
  description:
    "Entrez votre code postal pour retrouver votre département et accéder rapidement aux informations sur votre circonscription et les prochaines séances à l'Assemblée nationale.",
  openGraph: {
    title: "Ma circonscription | Agora",
    description:
      "À partir de votre code postal, retrouvez votre département et les liens utiles pour suivre l'activité de l'Assemblée nationale.",
    type: "website"
  },
  alternates: { canonical: `${getBaseUrl()}/ma-circo` }
};

export default function MaCircoPage() {
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Ma circonscription" }
        ]}
      />
      <MaCircoClient />
    </div>
  );
}

