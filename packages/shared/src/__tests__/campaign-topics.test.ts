import { describe, it, expect } from "vitest";
import { getCampaignTopicsForAgendaItem } from "../campaign-topics";

describe("getCampaignTopicsForAgendaItem", () => {
  it("returns empty array for empty or null input", () => {
    expect(getCampaignTopicsForAgendaItem(null, null)).toEqual([]);
    expect(getCampaignTopicsForAgendaItem("", "")).toEqual([]);
    expect(getCampaignTopicsForAgendaItem(undefined, undefined)).toEqual([]);
  });

  it("matches pouvoir d'achat / economy keywords", () => {
    const r = getCampaignTopicsForAgendaItem(
      "Projet de loi de finances 2026",
      null
    );
    expect(r.some((t) => t.slug === "pouvoir-achat")).toBe(true);
    expect(r.find((t) => t.slug === "pouvoir-achat")?.label).toBe(
      "Pouvoir d'achat & économie"
    );
  });

  it("matches climat / environment keywords", () => {
    const r = getCampaignTopicsForAgendaItem(
      "Transition énergétique et biodiversité",
      null
    );
    expect(r.some((t) => t.slug === "climat")).toBe(true);
  });

  it("matches multiple themes when several keywords present", () => {
    const r = getCampaignTopicsForAgendaItem(
      "Budget santé et réforme de l'école",
      null
    );
    expect(r.some((t) => t.slug === "sante")).toBe(true);
    expect(r.some((t) => t.slug === "education")).toBe(true);
  });

  it("matches from description when title has no keyword", () => {
    const r = getCampaignTopicsForAgendaItem(
      "Discussion générale",
      "Projet de loi relatif aux fraudes sociales et fiscales"
    );
    expect(r.some((t) => t.slug === "pouvoir-achat")).toBe(true);
  });

  it("returns empty when no keyword matches", () => {
    const r = getCampaignTopicsForAgendaItem(
      "Questions diverses",
      "Organisation des débats"
    );
    expect(r).toEqual([]);
  });
});
