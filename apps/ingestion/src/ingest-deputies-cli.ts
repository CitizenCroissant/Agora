/**
 * CLI for deputies ingestion
 * Usage: npm run ingest:deputies [-- --dry-run]
 */

import { ingestDeputies, IngestDeputiesOptions } from "./ingest-deputies";

const args = process.argv.slice(2);
const options: IngestDeputiesOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dry-run") {
    options.dryRun = true;
  }
}

ingestDeputies(options)
  .then(() => {
    console.log("Deputies ingestion complete.");
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
