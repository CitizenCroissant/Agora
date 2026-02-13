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
  | "comprendre"
  | "about";

type NavSection = {
  id: NavSectionId;
  label: string;
  href: string;
  children?: NavChild[];
};

const NAV_SECTIONS: NavSection[] = [
  { id: "home", label: "Aujourd'hui", href: "/" },
  {
    id: "votes",
    label: "Votes",
    href: "/votes",
    children: [
      { label: "Tous les scrutins", href: "/votes" },
      { label: "Prochains votes", href: "/votes/upcoming" },
      { label: "Votes par député", href: "/votes/deputy" }
    ]
  },
  { id: "calendar", label: "Calendrier", href: "/timeline" },
  {
    id: "explore",
    label: "Explorer",
    href: "/bills",
    children: [
      { label: "Textes", href: "/bills" },
      { label: "Commissions", href: "/commissions" },
      { label: "Groupes politiques", href: "/groupes" },
      { label: "Mon député", href: "/mon-depute" },
      { label: "Circonscriptions", href: "/circonscriptions" },
      { label: "Recherche", href: "/search" }
    ]
  },
  { id: "comprendre", label: "Comprendre", href: "/democratie" },
  {
    id: "about",
    label: "À propos",
    href: "/about",
    children: [{ label: "Sources de données", href: "/sources" }]
  }
] satisfies NavSection[];

export function AppHeader() {
  const [openSectionId, setOpenSectionId] = useState<NavSectionId | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenSectionId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggle = (id: NavSectionId) => {
    setOpenSectionId((current) => (current === id ? null : id));
  };

  const handleClose = () => {
    setOpenSectionId(null);
  };

  return (
    <header className={styles.wrapper}>
      <div className="container">
        <div className={styles.bar} onMouseLeave={handleClose}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandName}>Agora</span>
            <span className={styles.brandTagline}>
              L&apos;Assemblée nationale, en clair
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Navigation principale">
            {NAV_SECTIONS.map((section) => {
              const hasChildren = !!section.children?.length;
              const isOpen = openSectionId === section.id;
              const isActive =
                pathname === section.href ||
                !!section.children?.some((child) =>
                  pathname.startsWith(child.href)
                );

              const itemClass = [
                styles.navItem,
                (hasChildren ? isActive || isOpen : isActive)
                  ? styles.navItemActive
                  : ""
              ]
                .filter(Boolean)
                .join(" ");

              if (!hasChildren) {
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className={itemClass}
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
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={() => handleToggle(section.id)}
                  >
                    {section.label}
                    <span aria-hidden="true" className={styles.caret}>
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
        </div>
      </div>
    </header>
  );
}
