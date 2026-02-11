import { Suspense } from "react";
import BillsPageClient from "./BillsPageClient";

export default function BillsPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div>Chargement des textes...</div>
        </div>
      }
    >
      <BillsPageClient />
    </Suspense>
  );
}

