#!/usr/bin/env node
/**
 * Phase 4 — P4-T6: Change Log Generator
 *
 * Reads a deployment receipt JSON (from promote-to-production.cjs) and
 * generates a structured change log entry in markdown.
 *
 * Usage:
 *   node scripts/promote/generate-changelog.cjs \
 *     --receipt output/deployment-2026-03-06T*.json \
 *     [--approver "Jane Smith <j.smith@agency.gov>"]
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { receipt: null, approver: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--receipt': opts.receipt = args[++i]; break;
      case '--approver': opts.approver = args[++i]; break;
    }
  }

  if (!opts.receipt) {
    console.error('Usage: node generate-changelog.cjs --receipt <deployment-json> [--approver <name>]');
    process.exit(1);
  }

  return opts;
}

// ============================================================================
// Main
// ============================================================================

function generateEntry(receipt, approver) {
  const date = new Date(receipt.timestamp).toISOString().slice(0, 10);
  const lines = [];

  lines.push(`## Deployment: ${date}`);
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| **Batch ID** | \`${receipt.batchId}\` |`);
  lines.push(`| **SSP ID** | \`${receipt.sspId}\` |`);
  lines.push(`| **Target** | ${receipt.apiUrl} |`);
  lines.push(`| **Timestamp** | ${receipt.timestamp} |`);
  lines.push(`| **Approver** | ${approver || 'N/A'} |`);
  lines.push(`| **Dry Run** | ${receipt.dryRun ? 'Yes' : 'No'} |`);
  lines.push('');

  lines.push('### Data Deployed');
  lines.push('');
  lines.push('| Collection | Attempted | Created | Duplicates | Errors |');
  lines.push('|------------|-----------|---------|------------|--------|');

  let totalAttempted = 0, totalCreated = 0, totalDups = 0, totalErrors = 0;

  for (const [name, stats] of Object.entries(receipt.collections)) {
    lines.push(`| ${name} | ${stats.attempted} | ${stats.created} | ${stats.duplicates} | ${stats.errors} |`);
    totalAttempted += stats.attempted;
    totalCreated += stats.created;
    totalDups += stats.duplicates;
    totalErrors += stats.errors;
  }

  lines.push(`| **Total** | **${totalAttempted}** | **${totalCreated}** | **${totalDups}** | **${totalErrors}** |`);
  lines.push('');

  lines.push('### Rollback Command');
  lines.push('');
  lines.push('```sql');
  lines.push(`DELETE FROM control_definitions WHERE batch_id = '${receipt.batchId}';`);
  lines.push(`DELETE FROM control_implementations WHERE batch_id = '${receipt.batchId}';`);
  lines.push(`DELETE FROM assets WHERE batch_id = '${receipt.batchId}';`);
  lines.push(`DELETE FROM vulnerability_findings WHERE batch_id = '${receipt.batchId}';`);
  lines.push(`DELETE FROM poam_items WHERE batch_id = '${receipt.batchId}';`);
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

function main() {
  const opts = parseArgs();
  const receiptPath = path.resolve(opts.receipt);

  if (!fs.existsSync(receiptPath)) {
    console.error(`Receipt file not found: ${receiptPath}`);
    process.exit(1);
  }

  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf-8'));
  const entry = generateEntry(receipt, opts.approver);

  // Print to stdout
  console.log(entry);

  // Append to CHANGELOG.md
  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const changelogPath = path.join(outDir, 'CHANGELOG.md');
  let existing = '';
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, 'utf-8');
  } else {
    existing = '# Deployment Change Log\n\n';
  }

  // Prepend new entry (most recent first)
  const header = '# Deployment Change Log\n\n';
  const body = existing.replace(header, '');
  fs.writeFileSync(changelogPath, header + entry + body);

  console.log(`Appended to: ${changelogPath}`);
}

main();
