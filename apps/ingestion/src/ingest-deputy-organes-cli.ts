/**
 * CLI for ingesting deputy-organe memberships (commissions, etc.) from AMO.
 * Usage: npm run ingest:deputy-organes [-- --dry-run]
 * Run after: ingest:organes, ingest:deputies
 */

import { ingestDeputyOrganes } from "./ingest-deputy-organes";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

ingestDeputyOrganes({ dryRun })
  .then((out) => {
    console.log("Done:", out);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
