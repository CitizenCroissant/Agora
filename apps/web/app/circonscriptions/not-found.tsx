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
        background: "var(--color-background)"
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "var(--color-text)" }}>404</h1>
      <p style={{ color: "var(--color-text-light)", marginBottom: "1.5rem" }}>
        Circonscription introuvable.
      </p>
      <Link
        href="/circonscriptions"
        style={{
          color: "var(--color-primary)",
          fontWeight: 600,
          textDecoration: "none"
        }}
      >
        ← Retour aux circonscriptions
      </Link>
    </div>
  );
}
