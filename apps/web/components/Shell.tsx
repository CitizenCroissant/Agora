"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SittingReminderBanner } from "@/components/SittingReminderBanner";
import styles from "./Shell.module.css";

/**
 * Derives the active section color CSS variable from the current pathname.
 * This is applied as --current-section-color on the page wrapper so that
 * child components can inherit section theming.
 */
function getSectionColor(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/seance")) {
    return "var(--color-section-aujourdhui)";
  }
  if (pathname.startsWith("/votes")) return "var(--color-section-votes)";
  if (pathname.startsWith("/timeline")) return "var(--color-section-calendrier)";
  if (
    pathname.startsWith("/bills") ||
    pathname.startsWith("/commissions") ||
    pathname.startsWith("/groupes") ||
    pathname.startsWith("/deputy") ||
    pathname.startsWith("/depute") ||
    pathname.startsWith("/mon-depute") ||
    pathname.startsWith("/ma-circo") ||
    pathname.startsWith("/circonscriptions") ||
    pathname.startsWith("/search")
  ) {
    return "var(--color-section-explorer)";
  }
  if (
    pathname.startsWith("/democratie") ||
    pathname.startsWith("/municipales") ||
    pathname.startsWith("/elections") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/sources") ||
    pathname.startsWith("/embed")
  ) {
    return "var(--color-section-comprendre)";
  }
  return "var(--color-primary)";
}

/**
 * Wraps the app shell (header + main + footer).
 * For /embed/deputy/... (widget iframe) routes, renders only children so
 * widgets can be iframed without site chrome. The /embed page itself keeps
 * the full shell.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWidgetIframe =
    pathname != null &&
    pathname.startsWith("/embed/") &&
    pathname !== "/embed";

  if (isWidgetIframe) {
    return <>{children}</>;
  }

  const sectionColor = getSectionColor(pathname ?? "/");

  return (
    <div
      className="pageLayout"
      style={
        { "--current-section-color": sectionColor } as React.CSSProperties
      }
    >
      <a href="#main-content" className={styles.skipLink}>
        Aller au contenu
      </a>
      <AppHeader />
      <SittingReminderBanner />
      <main id="main-content" className="pageMain" tabIndex={-1}>
        {/* key forces remount on navigation, triggering the CSS entrance animation */}
        <div key={pathname} className={styles.pageTransition}>
          {children}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
