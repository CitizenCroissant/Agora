"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SittingReminderBanner } from "@/components/SittingReminderBanner";

/**
 * Wraps the app shell (header + main + footer). For /embed/deputy/... (widget iframe) routes, renders only children so widgets can be iframed without site chrome.
 * The /embed page itself (documentation) keeps the full shell.
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

  return (
    <div className="pageLayout">
      <AppHeader />
      <SittingReminderBanner />
      <main className="pageMain">{children}</main>
      <AppFooter />
    </div>
  );
}
