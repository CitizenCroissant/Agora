/**
 * GET /api/digest/unsubscribe?token=...
 * One-click unsubscribe from the weekly digest. Renders a simple HTML page.
 */

import { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(405).end(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Désinscription</title></head><body><p>Méthode non autorisée.</p></body></html>"
    );
    return;
  }

  const token = (req.query.token as string)?.trim();
  if (!token) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(400).end(
      `<!DOCTYPE html>
<html><head><meta charset='utf-8'><title>Désinscription</title></head>
<body><p>Lien de désinscription invalide (token manquant).</p></body></html>`
    );
    return;
  }

  const { error } = await supabase
    .from("digest_subscriptions")
    .delete()
    .eq("unsubscribe_token", token);

  if (error) {
    console.error("digest unsubscribe error:", error);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(500).end(
      `<!DOCTYPE html>
<html><head><meta charset='utf-8'><title>Erreur</title></head>
<body><p>Une erreur s'est produite. Réessayez plus tard.</p></body></html>`
    );
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).end(
    `<!DOCTYPE html>
<html><head><meta charset='utf-8'><title>Désinscription</title></head>
<body>
  <p>Vous êtes bien désinscrit de la lettre «&nbsp;Mon député cette semaine&nbsp;».</p>
  <p>Vous ne recevrez plus ce récapitulatif par e-mail.</p>
</body></html>`
  );
}
