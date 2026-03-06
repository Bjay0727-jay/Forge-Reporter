#!/usr/bin/env node
/**
 * Phase 4 — P4-T5: Production Smoke Test
 *
 * Hits critical API endpoints on production after deployment and verifies
 * data is present. Optionally compares row counts against a staging report.
 *
 * Usage:
 *   node scripts/promote/smoke-test.cjs \
 *     --ssp-id <uuid> \
 *     --api-url https://forgecomply360-api.workers.dev \
 *     --token <jwt> \
 *     [--staging-report output/staging-validation-*.json]
 */

const fs = require('fs');
const path = require('path');
const { fetchEndpoint, getItemCount } = require('./validate-staging.cjs');

const RATE_LIMIT_MS = 200;

// Critical sections: S4 (system info), S9 (boundary/assets), S15 (controls), S23 (POA&M), vulns
const CRITICAL_ENDPOINTS = [
  { path: '',                        key: 'document',                 type: 'object',  critical: true, label: 'SSP Document (S4)' },
  { path: '/control-implementations', key: 'control_implementations', type: 'array',   critical: true, label: 'Control Implementations (S15)' },
  { path: '/assets',                 key: 'assets',                   type: 'array',   critical: true, label: 'Assets (S9)' },
  { path: '/vulnerability-findings', key: 'vulnerability_findings',   type: 'array',   critical: true, label: 'Vulnerability Findings' },
  { path: '/poam-items',             key: 'poam_items',               type: 'array',   critical: true, label: 'POA&M Items (S23)' },
];

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { sspId: null, apiUrl: null, token: null, stagingReport: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--ssp-id': opts.sspId = args[++i]; break;
      case '--api-url': opts.apiUrl = args[++i]; break;
      case '--token': opts.token = args[++i]; break;
      case '--staging-report': opts.stagingReport = args[++i]; break;
    }
  }

  if (!opts.sspId || !opts.apiUrl || !opts.token) {
    console.error('Usage: node smoke-test.cjs --ssp-id <uuid> --api-url <url> --token <jwt> [--staging-report <path>]');
    process.exit(1);
  }

  return opts;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Main
// ============================================================================

async function smokeTest(opts) {
  const { sspId, apiUrl, token, stagingReport } = opts;
  console.log(`Production smoke test: ${apiUrl}/api/v1/ssp/${sspId}`);
  console.log(`Checking ${CRITICAL_ENDPOINTS.length} critical endpoints...\n`);

  // Load staging report for comparison if provided
  let stagingCounts = null;
  if (stagingReport) {
    const reportPath = path.resolve(stagingReport);
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      stagingCounts = {};
      for (const ep of report.endpoints) {
        stagingCounts[ep.path] = ep.itemCount;
      }
      console.log(`Loaded staging report for comparison: ${reportPath}\n`);
    } else {
      console.warn(`Staging report not found: ${reportPath} — skipping comparison\n`);
    }
  }

  const results = [];
  let failures = 0;
  let warnings = 0;

  for (const ep of CRITICAL_ENDPOINTS) {
    const result = await fetchEndpoint(apiUrl, sspId, token, ep);
    const count = getItemCount(result);
    const has = count > 0;

    let status;
    if (!result.ok) {
      status = 'FAIL';
      failures++;
    } else if (!has) {
      status = 'FAIL (empty)';
      failures++;
    } else {
      status = 'PASS';
    }

    // Compare with staging if available
    let comparison = '';
    if (stagingCounts && ep.path in stagingCounts) {
      const stagingCount = stagingCounts[ep.path];
      if (stagingCount > 0) {
        const diff = Math.abs(count - stagingCount);
        const pctDiff = Math.round((diff / stagingCount) * 100);
        if (pctDiff > 5) {
          comparison = ` [WARN: staging=${stagingCount}, diff=${pctDiff}%]`;
          warnings++;
        } else {
          comparison = ` [matches staging: ${stagingCount}]`;
        }
      }
    }

    console.log(`  ${status.padEnd(14)} ${ep.label.padEnd(35)} count=${count}${comparison}`);

    results.push({
      label: ep.label,
      path: ep.path,
      ok: result.ok,
      httpStatus: result.status,
      itemCount: count,
      passed: result.ok && has,
      error: result.error || null,
    });

    await sleep(RATE_LIMIT_MS);
  }

  console.log('');

  // Save report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const report = {
    timestamp: new Date().toISOString(),
    apiUrl,
    sspId,
    results,
    failures,
    warnings,
    passed: failures === 0,
  };

  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `smoke-test-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Report saved: ${outPath}`);

  if (failures > 0) {
    console.log(`\nFAILED: ${failures} endpoint(s) did not pass. Investigate immediately.`);
    if (warnings > 0) console.log(`${warnings} warning(s) about staging count mismatches.`);
    process.exit(1);
  } else {
    console.log(`\nPASSED: All ${CRITICAL_ENDPOINTS.length} critical endpoints verified.`);
    if (warnings > 0) console.log(`${warnings} warning(s) about staging count mismatches — review above.`);
  }

  return report;
}

if (require.main === module) {
  const opts = parseArgs();
  smokeTest(opts).catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { smokeTest };
