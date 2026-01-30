/**
 * CLI for circonscriptions ingestion
 * Usage: npm run ingest:circonscriptions [-- --dry-run]
 *
 * Fetches circonscriptions from official source (data.gouv.fr GeoJSON) and upserts
 * into circonscriptions table. Run this before ingest:deputies so the FK is satisfied.
 */

import {
  ingestCirconscriptions,
  IngestCirconscriptionsOptions,
} from "./ingest-circonscriptions";

const args = process.argv.slice(2);
const options: IngestCirconscriptionsOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dry-run") {
    options.dryRun = true;
  }
}

ingestCirconscriptions(options)
  .then(() => {
    console.log("Circonscriptions ingestion complete.");
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
