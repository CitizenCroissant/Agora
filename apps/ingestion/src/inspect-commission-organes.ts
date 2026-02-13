/**
 * One-off script to inspect reunion types and organeRef in the Agenda archive.
 * Run: npx ts-node src/inspect-commission-organes.ts [from] [to]
 */

import { Readable } from "stream";
import unzipper from "unzipper";
import { assembleeClient } from "./assemblee-client";

// Access internal cache to get raw reunions (by re-downloading we get raw types)
async function getRawReunions(legislature: string): Promise<unknown[]> {
  const url = `https://data.assemblee-nationale.fr/static/openData/repository/${legislature}/vp/reunions/Agenda.json.zip`;
  const response = await (globalThis as any).fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const reunions: unknown[] = [];
  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(unzipper.Parse())
      .on("entry", async (entry: unzipper.Entry) => {
        if (entry.path.endsWith(".json") && entry.path.includes("json/reunion/")) {
          try {
            const content = await entry.buffer();
            const data = JSON.parse(content.toString("utf-8")) as { reunion?: unknown };
            if (data.reunion) reunions.push(data.reunion);
          } catch {
            // skip
          }
        } else {
          entry.autodrain();
        }
      })
      .on("error", reject)
      .on("close", resolve);
  });
  return reunions;
}

function getDate(r: unknown): string {
  const ident = (r as { identifiants?: { DateSeance?: string } }).identifiants;
  const ds = ident?.DateSeance;
  return ds ? ds.split("+")[0] : "";
}

function getType(r: unknown): string {
  return ((r as { "@xsi:type"?: string })["@xsi:type"]) ?? "";
}

function getOrgane(r: unknown): string {
  return ((r as { organeReuniRef?: string }).organeReuniRef) ?? "";
}

async function main() {
  const from = process.argv[2] ?? "2025-01-01";
  const to = process.argv[3] ?? "2026-12-31";
  const leg = "17";

  console.log("Downloading full agenda archive (raw)...");
  const raw = await getRawReunions(leg);

  const byType = new Map<string, number>();
  const commissionByOrgane = new Map<string, number>();
  let inRange = 0;
  let commissionInRange = 0;

  for (const r of raw) {
    const t = getType(r);
    byType.set(t, (byType.get(t) ?? 0) + 1);

    const date = getDate(r);
    if (date >= from && date <= to) {
      inRange++;
      if (t === "reunionCommission_type") {
        commissionInRange++;
        const ref = getOrgane(r).trim() || "(empty)";
        commissionByOrgane.set(ref, (commissionByOrgane.get(ref) ?? 0) + 1);
      }
    }
  }

  console.log("\nAll reunions in archive by @xsi:type:");
  for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t || "(missing)"} → ${n}`);
  }

  console.log(`\nReunions in date range ${from}..${to}: ${inRange}`);
  console.log(`  reunionCommission_type in range: ${commissionInRange}`);

  if (commissionByOrgane.size > 0) {
    console.log("\nCommission reunions in range by organeReuniRef:");
    for (const [ref, n] of [...commissionByOrgane.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${ref} → ${n}`);
    }
  }

  // Date range of commission reunions
  const commissionReunions = raw.filter((r) => getType(r) === "reunionCommission_type");
  const dates = commissionReunions.map(getDate).filter(Boolean).sort();
  if (dates.length > 0) {
    console.log(`\nCommission reunions date range in archive: ${dates[0]} .. ${dates[dates.length - 1]}`);
  }

  // Sample commission reunion and organe refs
  const byOrganeAll = new Map<string, number>();
  for (const r of commissionReunions) {
    const ref = getOrgane(r).trim() || "(empty)";
    byOrganeAll.set(ref, (byOrganeAll.get(ref) ?? 0) + 1);
  }
  console.log(`\nUnique organeReuniRef for commission reunions (all dates): ${byOrganeAll.size}`);
  const topOrganes = [...byOrganeAll.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [ref, n] of topOrganes) {
    console.log(`  ${ref} → ${n}`);
  }

  if (commissionReunions.length > 0) {
    const s = commissionReunions[0] as Record<string, unknown>;
    console.log("\nSample commission reunion - timeStampDebut:", s.timeStampDebut, "identifiants:", s.identifiants);
    function getDateFromStamp(r: unknown): string {
      const ts = (r as { timeStampDebut?: string }).timeStampDebut;
      if (!ts) return "";
      return ts.split("T")[0];
    }
    const withStamp = commissionReunions.filter((r) => getDateFromStamp(r) >= from && getDateFromStamp(r) <= to);
    console.log(`Commission reunions in range using timeStampDebut: ${withStamp.length}`);
  }

  // Verify assembleeClient now returns commission reunions for range
  console.log("\n--- Using assembleeClient.fetchCommissionReunionsRange ---");
  const fromClient = await assembleeClient.fetchCommissionReunionsRange(from, to, leg);
  const byOrganeClient = new Map<string, number>();
  for (const r of fromClient) {
    const ref = (r.organeRef ?? "").trim() || "(empty)";
    byOrganeClient.set(ref, (byOrganeClient.get(ref) ?? 0) + 1);
  }
  console.log(`Commission reunions from client: ${fromClient.length}`);
  console.log("Top organeRef from client:", [...byOrganeClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
