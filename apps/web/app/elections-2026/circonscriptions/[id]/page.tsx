import { redirect } from "next/navigation";

/**
 * The per-circumscription election page was a placeholder for legislative
 * elections. Municipal elections use communes, not legislative circumscriptions.
 * Redirect to the main municipales page.
 */
export default function ElectionsCircoRedirect() {
  redirect("/municipales-2026");
}
