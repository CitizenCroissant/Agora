import { ImageResponse } from "next/og";
import { apiClient } from "@/lib/api";
import { formatDate } from "@agora/shared";

export const alt = "Scrutin – Agora";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trim() + "…";
}

export default async function Image({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let title = "Scrutin";
  let subtitle = "";
  let resultLabel = "";
  let quoteLine = "";

  try {
    const scrutin = await apiClient.getScrutin(id);
    title = truncate(scrutin.titre, 90);
    const pour = scrutin.synthese_pour;
    const contre = scrutin.synthese_contre;
    quoteLine =
      scrutin.sort_code === "adopté"
        ? `Adopté à ${pour} voix · ${formatDate(scrutin.date_scrutin)}`
        : `Rejeté (${pour} pour, ${contre} contre) · ${formatDate(scrutin.date_scrutin)}`;
    subtitle = `Scrutin n°${scrutin.numero}`;
    resultLabel = scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté";
  } catch {
    subtitle = "Agora";
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          fontFamily: "system-ui, sans-serif"
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "24px 48px",
            background: "#0055a4",
            color: "#ffffff",
            fontSize: 28,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <span>Agora – Assemblée nationale</span>
          {resultLabel && (
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 22,
                fontWeight: 700
              }}
            >
              {resultLabel}
            </span>
          )}
        </div>
        <div
          style={{
            flex: 1,
            padding: "48px 48px 56px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#666666",
              marginBottom: 12
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.2,
              marginBottom: 16
            }}
          >
            {title}
          </div>
          {quoteLine && (
            <div
              style={{
                fontSize: 24,
                color: "#0055a4",
                fontWeight: 600
              }}
            >
              {quoteLine}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
