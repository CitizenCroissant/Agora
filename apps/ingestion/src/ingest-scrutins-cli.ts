/**
 * CLI for scrutins ingestion
 * Usage: npm run ingest:scrutins [-- --from YYYY-MM-DD --to YYYY-MM-DD] [--dry-run]
 */

import { ingestScrutins, IngestScrutinsOptions } from "./ingest-scrutins";

const args = process.argv.slice(2);
const options: IngestScrutinsOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--from" && args[i + 1]) {
    options.fromDate = args[i + 1];
    i++;
  } else if (args[i] === "--to" && args[i + 1]) {
    options.toDate = args[i + 1];
    i++;
  } else if (args[i] === "--dry-run") {
    options.dryRun = true;
  }
}

ingestScrutins(options)
  .then(() => {
    console.log("Scrutins ingestion complete.");
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
