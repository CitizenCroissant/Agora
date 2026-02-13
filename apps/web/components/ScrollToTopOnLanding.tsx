"use client";

import { useLayoutEffect } from "react";

/**
 * Scrolls the window to top when the user lands on the page without a hash.
 * Prevents Next.js scroll restoration or initial focus from leaving the page
 * scrolled to a section (e.g. #loi). useLayoutEffect runs before paint to avoid a visible jump.
 */
export function ScrollToTopOnLanding() {
  useLayoutEffect(() => {
    if (typeof window === "undefined" || window.location.hash) return;
    window.scrollTo(0, 0);
  }, []);
  return null;
}
