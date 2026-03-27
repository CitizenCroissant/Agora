"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AppHeader.module.css";

type NavChild = {
  label: string;
  href: string;
};

type NavSectionId =
  | "home"
  | "votes"
  | "calendar"
  | "explore"
  | "comprendre";

type NavSection = {
  id: NavSectionId;
  label: string;
  href: string;
  color: string;
  children?: NavChild[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "home",
    label: "Aujourd'hui",
    href: "/",
    color: "var(--color-section-aujourdhui)"
  },
  {
    id: "votes",
    label: "Votes",
    href: "/votes",
    color: "var(--color-section-votes)",
    children: [
      { label: "Tous les scrutins", href: "/votes" },
      { label: "Prochains votes", href: "/votes/upcoming" },
      { label: "Votes par député", href: "/votes/deputy" }
    ]
  },
  {
    id: "calendar",
    label: "Calendrier",
    href: "/timeline",
    color: "var(--color-section-calendrier)"
  },
  {
    id: "explore",
    label: "Explorer",
    href: "/bills",
    color: "var(--color-section-explorer)",
    children: [
      { label: "Dossiers législatifs", href: "/bills" },
      { label: "Commissions", href: "/commissions" },
      { label: "Groupes politiques", href: "/groupes" },
      { label: "Mon député", href: "/mon-depute" },
      { label: "Ma circonscription (code postal)", href: "/ma-circo" },
      { label: "Circonscriptions", href: "/circonscriptions" },
      { label: "Recherche", href: "/search" }
    ]
  },
  {
    id: "comprendre",
    label: "Comprendre",
    href: "/democratie",
    color: "var(--color-section-comprendre)",
    children: [
      { label: "Comprendre la démocratie", href: "/democratie" },
      { label: "Les élections municipales", href: "/democratie/elections-municipales" },
      { label: "Municipales 2026", href: "/municipales-2026" }
    ]
  }
] satisfies NavSection[];

export function AppHeader() {
  const [openSectionId, setOpenSectionId] = useState<NavSectionId | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenSectionId(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenSectionId(null);
  }, [pathname]);

  const handleToggle = (id: NavSectionId) => {
    setOpenSectionId((current) => (current === id ? null : id));
  };

  const handleClose = () => setOpenSectionId(null);

  return (
    <header
      className={[styles.wrapper, scrolled ? styles.scrolled : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="container">
        <div className={styles.bar} onMouseLeave={handleClose}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandName}>Agora</span>
            <span className={styles.brandTagline}>
              L&apos;Assemblée nationale, en clair
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.nav} aria-label="Navigation principale">
            {NAV_SECTIONS.map((section) => {
              const hasChildren = !!section.children?.length;
              const isOpen = openSectionId === section.id;
              const isActive =
                pathname === section.href ||
                !!section.children?.some((child) =>
                  pathname.startsWith(child.href)
                );
              const showActive = hasChildren ? isActive || isOpen : isActive;
              const itemClass = [
                styles.navItem,
                showActive ? styles.navItemActive : ""
              ]
                .filter(Boolean)
                .join(" ");

              if (!hasChildren) {
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className={itemClass}
                    style={
                      { "--section-accent": section.color } as React.CSSProperties
                    }
                  >
                    {section.label}
                  </Link>
                );
              }

              return (
                <div
                  key={section.id}
                  className={styles.menuSection}
                  onMouseEnter={() => setOpenSectionId(section.id)}
                >
                  <button
                    type="button"
                    className={itemClass}
                    style={
                      { "--section-accent": section.color } as React.CSSProperties
                    }
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={() => handleToggle(section.id)}
                  >
                    {section.label}
                    <span
                      aria-hidden="true"
                      className={[
                        styles.caret,
                        isOpen ? styles.caretOpen : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className={styles.dropdown} role="menu">
                      {section.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={styles.dropdownItem}
                          role="menuitem"
                          onClick={handleClose}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className={[
              styles.hamburger,
              mobileOpen ? styles.hamburgerOpen : ""
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu} aria-label="Menu mobile">
          <div className="container">
            {NAV_SECTIONS.map((section) => (
              <div key={section.id} className={styles.mobileSection}>
                <Link
                  href={section.href}
                  className={styles.mobileSectionLink}
                  onClick={() => setMobileOpen(false)}
                >
                  <span
                    className={styles.mobileSectionDot}
                    style={{ background: section.color }}
                  />
                  {section.label}
                </Link>
                {section.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={styles.mobileChildLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
