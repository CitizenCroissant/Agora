/**
 * One-off: inspect Amendements.json.zip structure (paths + first JSON keys).
 * Run: npx ts-node scripts/inspect-amendements-zip.ts
 */

const BASE =
  "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/amendements_div_legis/Amendements.json.zip";

async function main() {
  console.log("Fetching ZIP...");
  const res = await (globalThis as unknown as { fetch: (u: string) => Promise<Response> }).fetch(BASE);
  if (!res.ok) throw new Error(res.statusText);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log("ZIP size (MB):", (buf.length / 1024 / 1024).toFixed(2));

  const unzipper = await import("unzipper");
  const { Readable } = await import("stream");
  const paths: string[] = [];
  let firstJsonContent: string | null = null;
  let firstJsonPath: string | null = null;

  await new Promise<void>((resolve, reject) => {
    Readable.from(buf)
      .pipe(unzipper.Parse())
      .on("entry", async (entry: { path: string; buffer: () => Promise<Buffer>; autodrain: () => void }) => {
        paths.push(entry.path);
        if (entry.path.endsWith(".json") && !firstJsonContent) {
          firstJsonContent = (await entry.buffer()).toString("utf-8");
          firstJsonPath = entry.path;
        }
        entry.autodrain();
      })
      .on("error", reject)
      .on("close", resolve);
  });

  console.log("\nTotal entries:", paths.length);
  console.log("First 25 paths:");
  paths.slice(0, 25).forEach((p) => console.log(" ", p));

  if (firstJsonPath && firstJsonContent) {
    console.log("\nFirst JSON file:", firstJsonPath);
    const data = JSON.parse(firstJsonContent) as unknown;
    const keys = data && typeof data === "object" ? Object.keys(data as object) : [];
    console.log("Top-level keys:", keys.join(", "));
    if (Array.isArray(data)) {
      console.log("Root is array, length:", data.length);
      if (data.length > 0 && typeof data[0] === "object") {
        console.log("First element keys:", Object.keys(data[0] as object).join(", "));
      }
    } else if (data && typeof data === "object") {
      const r = data as Record<string, unknown>;
      const amend = r.amendement ?? r.amendements;
      if (amend && typeof amend === "object") {
        console.log("amendement keys:", Object.keys(amend as object).join(", "));
        const a = amend as Record<string, unknown>;
        console.log("uid:", a.uid);
        console.log("identification:", JSON.stringify(a.identification)?.slice(0, 200));
        console.log("texteLegislatifRef:", a.texteLegislatifRef);
        console.log("triAmendement:", a.triAmendement);
      }
      for (const k of keys) {
        const v = r[k];
        if (Array.isArray(v)) console.log("  ", k, "-> array length", v.length);
        else if (v && typeof v === "object") console.log("  ", k, "-> object keys", Object.keys(v as object).slice(0, 10).join(", "));
        else console.log("  ", k, "->", String(v).slice(0, 60));
      }
    }
  } else {
    console.log("\nNo .json file found in ZIP. Sample paths:", paths.slice(0, 5));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
