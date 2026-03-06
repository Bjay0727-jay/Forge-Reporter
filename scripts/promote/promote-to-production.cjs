#!/usr/bin/env node
/**
 * Phase 4 — P4-T4: Production Promotion Script
 *
 * Orchestrates the staging-to-production deployment. Runs pre-flight checks
 * (staging validation + production backup), then uploads seeded data to
 * the production API.
 *
 * Usage:
 *   node scripts/promote/promote-to-production.cjs \
 *     --ssp-id <uuid> \
 *     --api-url https://forge-comply360-api.stanley-riley.workers.dev \
 *     --staging-url https://forge-comply360-api-demo.stanley-riley.workers.dev \
 *     --token <jwt> \
 *     --data-dir scripts/seed-data/output \
 *     --narratives-dir scripts/seed-narratives/output \
 *     --confirm \
 *     [--dry-run]
 *
 * Safety features:
 *   - Requires --confirm flag
 *   - Validates staging data first
 *   - Backs up production pre-state
 *   - Generates deployment receipt with batch_id for rollback
 */

const fs = require('fs');
const path = require('path');
const { validate } = require('./validate-staging.cjs');
const { backup } = require('./backup-production.cjs');

const BATCH_SIZE = 50;
const RATE_LIMIT_MS = 500;
const MAX_RETRIES = 3;

// Collections to deploy, in order
const COLLECTIONS = [
  { name: 'control-implementations', file: 'control_implementations.json', endpoint: '/control-implementations' },
  { name: 'assets',                  file: 'assets.json',                  endpoint: '/assets' },
  { name: 'vulnerability-findings',  file: 'vulnerability_findings.json',  endpoint: '/vulnerability-findings' },
  { name: 'poam-items',              file: 'poams.json',                   endpoint: '/poam-items' },
];

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    sspId: null, apiUrl: null, stagingUrl: null, token: null,
    dataDir: null, narrativesDir: null, dryRun: false, confirm: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--ssp-id': opts.sspId = args[++i]; break;
      case '--api-url': opts.apiUrl = args[++i]; break;
      case '--staging-url': opts.stagingUrl = args[++i]; break;
      case '--token': opts.token = args[++i]; break;
      case '--data-dir': opts.dataDir = args[++i]; break;
      case '--narratives-dir': opts.narrativesDir = args[++i]; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--confirm': opts.confirm = true; break;
    }
  }

  if (!opts.sspId || !opts.apiUrl || !opts.token) {
    console.error('Usage: node promote-to-production.cjs \\');
    console.error('  --ssp-id <uuid> --api-url <prod-url> --token <jwt> \\');
    console.error('  --staging-url <staging-url> --data-dir <path> --narratives-dir <path> \\');
    console.error('  --confirm [--dry-run]');
    process.exit(1);
  }

  return opts;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Upload logic
// ============================================================================

async function postItem(apiUrl, sspId, token, endpoint, item) {
  const url = `${apiUrl}/api/v1/ssp/${sspId}${endpoint}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(item),
      });

      if (res.status === 409) {
        return { status: 'duplicate' };
      }

      if (res.status === 429) {
        await sleep(Math.pow(2, attempt + 1) * 1000);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status}: ${errText}`);
      }

      return { status: 'created' };
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, attempt + 1) * 1000);
      } else {
        return { status: 'error', error: err.message };
      }
    }
  }
}

async function uploadCollection(apiUrl, sspId, token, collection, items, dryRun) {
  console.log(`\n  Uploading ${collection.name}: ${items.length} items`);

  if (dryRun) {
    console.log(`    [DRY RUN] Would POST ${items.length} items to ${collection.endpoint}`);
    return { attempted: items.length, created: items.length, duplicates: 0, errors: 0 };
  }

  let created = 0, duplicates = 0, errors = 0;

  for (let i = 0; i < items.length; i++) {
    const result = await postItem(apiUrl, sspId, token, collection.endpoint, items[i]);

    switch (result.status) {
      case 'created': created++; break;
      case 'duplicate': duplicates++; break;
      case 'error':
        errors++;
        console.error(`    ERROR item ${i}: ${result.error}`);
        break;
    }

    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`    Progress: ${i + 1}/${items.length} (${created} created, ${duplicates} dups, ${errors} errors)`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`    Done: ${created} created, ${duplicates} duplicates, ${errors} errors`);
  return { attempted: items.length, created, duplicates, errors };
}

// ============================================================================
// Main
// ============================================================================

async function promote(opts) {
  const { sspId, apiUrl, stagingUrl, token, dataDir, narrativesDir, dryRun, confirm } = opts;
  const batchId = `seed-phase4-${new Date().toISOString().slice(0, 10)}`;

  console.log('='.repeat(72));
  console.log('  PRODUCTION PROMOTION');
  console.log('='.repeat(72));
  console.log(`  SSP ID:      ${sspId}`);
  console.log(`  Production:  ${apiUrl}`);
  console.log(`  Staging:     ${stagingUrl || '(skipped)'}`);
  console.log(`  Batch ID:    ${batchId}`);
  console.log(`  Dry run:     ${dryRun}`);
  console.log('='.repeat(72));

  if (!confirm && !dryRun) {
    console.error('\nERROR: --confirm flag required for production deployment.');
    console.error('Add --confirm to proceed, or use --dry-run to preview.');
    process.exit(1);
  }

  // Step 1: Validate staging (if staging URL provided)
  if (stagingUrl) {
    console.log('\n--- Step 1: Staging Validation ---');
    try {
      await validate({ sspId, apiUrl: stagingUrl, token });
    } catch (err) {
      console.error('Staging validation failed. Aborting promotion.');
      process.exit(1);
    }
  } else {
    console.log('\n--- Step 1: Staging Validation (SKIPPED — no --staging-url) ---');
  }

  // Step 2: Backup production
  if (!dryRun) {
    console.log('\n--- Step 2: Production Backup ---');
    await backup({ sspId, apiUrl, token, batchId });
  } else {
    console.log('\n--- Step 2: Production Backup (SKIPPED — dry run) ---');
  }

  // Step 3: Load data files
  console.log('\n--- Step 3: Loading Data ---');
  const collectionData = [];

  for (const col of COLLECTIONS) {
    // Check narratives dir first, then data dir
    const searchDirs = [narrativesDir, dataDir].filter(Boolean);
    let items = null;

    for (const dir of searchDirs) {
      const filePath = path.resolve(dir, col.file);
      if (fs.existsSync(filePath)) {
        items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log(`  Loaded ${col.name}: ${items.length} items from ${filePath}`);
        break;
      }
    }

    if (!items) {
      console.log(`  SKIP ${col.name}: no data file found (${col.file})`);
      continue;
    }

    collectionData.push({ collection: col, items });
  }

  if (collectionData.length === 0) {
    console.error('\nERROR: No data files found. Provide --data-dir and/or --narratives-dir.');
    process.exit(1);
  }

  // Step 4: Upload
  console.log('\n--- Step 4: Deploying to Production ---');
  const receipt = {
    timestamp: new Date().toISOString(),
    batchId,
    sspId,
    apiUrl,
    dryRun,
    collections: {},
  };

  let totalErrors = 0;

  for (const { collection, items } of collectionData) {
    const result = await uploadCollection(apiUrl, sspId, token, collection, items, dryRun);
    receipt.collections[collection.name] = result;
    totalErrors += result.errors;
  }

  // Save receipt
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const receiptPath = path.join(outDir, `deployment-${timestamp}.json`);
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

  console.log('\n--- Deployment Summary ---');
  console.log(`  Batch ID:  ${batchId}`);
  console.log(`  Receipt:   ${receiptPath}`);
  for (const [name, result] of Object.entries(receipt.collections)) {
    console.log(`  ${name}: ${result.created} created, ${result.duplicates} dups, ${result.errors} errors`);
  }

  if (totalErrors > 0) {
    console.log(`\nWARNING: ${totalErrors} total errors. Review logs and consider rollback.`);
    process.exit(1);
  } else {
    console.log('\nDeployment complete. Run smoke-test.cjs to verify.');
  }

  return receipt;
}

if (require.main === module) {
  const opts = parseArgs();
  promote(opts).catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { promote };
