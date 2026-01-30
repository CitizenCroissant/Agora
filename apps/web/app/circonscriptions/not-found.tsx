import Link from "next/link";

export default function CirconscriptionNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>404</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Circonscription introuvable.
      </p>
      <Link
        href="/circonscriptions"
        style={{
          color: "#0055a4",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        ← Retour aux circonscriptions
      </Link>
    </div>
  );
}
