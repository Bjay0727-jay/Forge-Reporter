#!/usr/bin/env node
/**
 * Phase 2: Narrative Upload Script
 *
 * Reads generated control_implementations.json and POSTs to the
 * ForgeComply 360 backend API in batches.
 *
 * Usage:
 *   node scripts/seed-narratives/upload-narratives.cjs \
 *     --input output/mfehr_control_implementations.json \
 *     --ssp-id <ssp-uuid> \
 *     --api-url https://forge-comply360-api-demo.stanley-riley.workers.dev \
 *     --token <jwt-token>
 */

const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 50;
const RATE_LIMIT_MS = 500;
const MAX_RETRIES = 3;

// ============================================================================
// CLI argument parsing
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: null, sspId: null, apiUrl: null, token: null, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input': opts.input = args[++i]; break;
      case '--ssp-id': opts.sspId = args[++i]; break;
      case '--api-url': opts.apiUrl = args[++i]; break;
      case '--token': opts.token = args[++i]; break;
      case '--dry-run': opts.dryRun = true; break;
    }
  }

  if (!opts.input || !opts.sspId || !opts.apiUrl || !opts.token) {
    console.error('Usage: node upload-narratives.cjs --input <json> --ssp-id <uuid> --api-url <url> --token <jwt>');
    console.error('  --dry-run    Print what would be uploaded without making API calls');
    process.exit(1);
  }

  return opts;
}

// ============================================================================
// API client
// ============================================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postItem(apiUrl, sspId, token, item) {
  const url = `${apiUrl}/api/v1/ssp/${sspId}/control-implementations`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          control_id: item.control_id,
          status: item.status || 'planned',
          implementation_narrative: item.implementation_narrative || '',
          responsibility: item.responsibility || 'shared',
          review_status: item.review_status || 'pending',
        }),
      });

      if (res.status === 409) {
        // Duplicate — already exists, skip silently
        return { status: 'duplicate', controlId: item.control_id };
      }

      if (res.status === 429) {
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.warn(`  Rate limited on ${item.control_id}. Waiting ${waitMs / 1000}s...`);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status}: ${errText}`);
      }

      return { status: 'created', controlId: item.control_id };
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, attempt + 1) * 1000);
      } else {
        return { status: 'error', controlId: item.control_id, error: err.message };
      }
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const opts = parseArgs();
  const inputPath = path.resolve(opts.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const implementations = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`Loaded ${implementations.length} control implementations`);
  console.log(`Target: ${opts.apiUrl}/api/v1/ssp/${opts.sspId}/control-implementations`);

  if (opts.dryRun) {
    console.log('\n--- DRY RUN ---');
    for (const impl of implementations) {
      const wordCount = (impl.implementation_narrative || '').split(/\s+/).length;
      console.log(`  ${impl.control_id}: ${impl.status} | ${wordCount} words | review: ${impl.review_status}`);
    }
    console.log(`\nWould upload ${implementations.length} items in ${Math.ceil(implementations.length / BATCH_SIZE)} batches.`);
    return;
  }

  let created = 0;
  let duplicates = 0;
  let errors = 0;

  for (let i = 0; i < implementations.length; i++) {
    const impl = implementations[i];
    const result = await postItem(opts.apiUrl, opts.sspId, opts.token, impl);

    switch (result.status) {
      case 'created': created++; break;
      case 'duplicate': duplicates++; break;
      case 'error':
        errors++;
        console.error(`  ERROR ${result.controlId}: ${result.error}`);
        break;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  Progress: ${i + 1}/${implementations.length} (${created} created, ${duplicates} dups, ${errors} errors)`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log('\n--- Upload Complete ---');
  console.log(`Created:    ${created}`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`Errors:     ${errors}`);
  console.log(`Total:      ${implementations.length}`);

  if (errors > 0) {
    console.log('\nWARNING: Some items failed to upload. Review errors above and retry.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
