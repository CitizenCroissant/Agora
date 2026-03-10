/**
 * CLI for amendments ingestion (lightweight list per texte).
 * Usage: npm run ingest:amendments [-- --legislature 17] [--dry-run]
 *
 * Run after ingest:dossiers so bills and bill_texts exist (bill_texts are created by dossier ingestion).
 */

import { ingestAmendments, IngestAmendmentsOptions } from "./ingest-amendments";

const args = process.argv.slice(2);
const options: IngestAmendmentsOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--legislature" && args[i + 1]) {
    options.legislature = args[i + 1];
    i++;
  } else if (args[i] === "--dry-run") {
    options.dryRun = true;
  }
}

ingestAmendments(options)
  .then((result) => {
    console.log("Amendments ingestion complete.", result);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
