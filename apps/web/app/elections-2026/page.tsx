import { redirect } from "next/navigation";

/**
 * The elections-2026 route previously hosted a campaign hub for the March 2026
 * elections. Now that the municipal elections are over, all content has moved
 * to /municipales-2026. This page permanently redirects.
 */
export default function Elections2026Redirect() {
  redirect("/municipales-2026");
}
