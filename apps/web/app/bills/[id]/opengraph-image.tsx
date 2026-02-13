import { ImageResponse } from "next/og";
import { apiClient } from "@/lib/api";

export const alt = "Texte législatif – Agora";
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
  let title = "Texte législatif";
  let subtitle = "";

  try {
    const bill = await apiClient.getBill(id);
    title = truncate(bill.short_title || bill.title, 90);
    if (bill.official_id) {
      subtitle = `Réf. ${bill.official_id}`;
    }
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
            fontWeight: 600
          }}
        >
          Agora – Assemblée nationale
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
            Texte législatif
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
          {subtitle && (
            <div
              style={{
                fontSize: 24,
                color: "#0055a4",
                fontWeight: 500
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
