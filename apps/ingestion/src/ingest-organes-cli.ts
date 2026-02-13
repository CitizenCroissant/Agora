/**
 * CLI for ingesting organes (commissions, etc.) from AMO.
 * Usage: npm run ingest:organes [-- --dry-run]
 */

import { ingestOrganes } from "./ingest-organes";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

ingestOrganes({ dryRun })
  .then((out) => {
    console.log("Done:", out);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
