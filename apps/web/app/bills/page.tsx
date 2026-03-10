import { Suspense } from "react";
import BillsPageClient from "./BillsPageClient";

export default function BillsPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div>Chargement des dossiers...</div>
        </div>
      }
    >
      <BillsPageClient />
    </Suspense>
  );
}

