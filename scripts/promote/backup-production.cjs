#!/usr/bin/env node
/**
 * Phase 4 — P4-T3: Production Backup Script
 *
 * Queries all API endpoints on production to capture current row counts,
 * then generates a rollback SQL file with batch_id-based DELETE statements.
 *
 * Usage:
 *   node scripts/promote/backup-production.cjs \
 *     --ssp-id <uuid> \
 *     --api-url https://forge-comply360-api.stanley-riley.workers.dev \
 *     --token <jwt> \
 *     --batch-id seed-phase4-2026-03-06
 */

const fs = require('fs');
const path = require('path');
const { ENDPOINTS, fetchEndpoint, getItemCount } = require('./validate-staging.cjs');

const RATE_LIMIT_MS = 200;

// Tables that support batch_id-based rollback
const ROLLBACK_TABLES = [
  'control_definitions',
  'control_implementations',
  'assets',
  'vulnerability_findings',
  'poam_items',
];

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { sspId: null, apiUrl: null, token: null, batchId: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--ssp-id': opts.sspId = args[++i]; break;
      case '--api-url': opts.apiUrl = args[++i]; break;
      case '--token': opts.token = args[++i]; break;
      case '--batch-id': opts.batchId = args[++i]; break;
    }
  }

  if (!opts.sspId || !opts.apiUrl || !opts.token) {
    console.error('Usage: node backup-production.cjs --ssp-id <uuid> --api-url <url> --token <jwt> [--batch-id <id>]');
    process.exit(1);
  }

  if (!opts.batchId) {
    opts.batchId = `seed-phase4-${new Date().toISOString().slice(0, 10)}`;
  }

  return opts;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Main
// ============================================================================

async function backup(opts) {
  const { sspId, apiUrl, token, batchId } = opts;
  console.log(`Pre-deployment backup: ${apiUrl}/api/v1/ssp/${sspId}`);
  console.log(`Batch ID for rollback: ${batchId}`);
  console.log(`Querying ${ENDPOINTS.length} endpoints...\n`);

  const counts = {};
  for (const ep of ENDPOINTS) {
    const result = await fetchEndpoint(apiUrl, sspId, token, ep);
    const count = getItemCount(result);
    counts[ep.label] = { path: ep.path, count, ok: result.ok, error: result.error || null };
    await sleep(RATE_LIMIT_MS);
  }

  // Print summary
  console.log('Current Production Row Counts:');
  console.log('-'.repeat(50));
  for (const [label, info] of Object.entries(counts)) {
    const status = info.ok ? `${info.count}` : `ERROR: ${info.error}`;
    console.log(`  ${label.padEnd(30)} ${status}`);
  }
  console.log('-'.repeat(50));

  // Generate rollback SQL
  const rollbackLines = [
    '-- Rollback SQL for production deployment',
    `-- Batch ID: ${batchId}`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- SSP ID: ${sspId}`,
    '',
    '-- Execute these statements to roll back all data from this deployment batch.',
    '-- This removes ONLY rows tagged with this batch_id, preserving pre-existing data.',
    '',
  ];

  for (const table of ROLLBACK_TABLES) {
    rollbackLines.push(`DELETE FROM ${table} WHERE batch_id = '${batchId}';`);
  }

  rollbackLines.push('');
  rollbackLines.push('-- If batch_id rollback is insufficient, restore from D1 snapshot.');

  // Save outputs
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const backupReport = {
    timestamp: new Date().toISOString(),
    apiUrl,
    sspId,
    batchId,
    counts,
  };

  const backupPath = path.join(outDir, `backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupReport, null, 2));
  console.log(`\nBackup report saved: ${backupPath}`);

  const rollbackPath = path.join(outDir, `rollback-${timestamp}.sql`);
  fs.writeFileSync(rollbackPath, rollbackLines.join('\n'));
  console.log(`Rollback SQL saved:  ${rollbackPath}`);

  return backupReport;
}

if (require.main === module) {
  const opts = parseArgs();
  backup(opts).catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { backup };
