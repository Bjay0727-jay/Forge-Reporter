#!/usr/bin/env node
/**
 * Phase 4 — P4-T1: Staging Validation Script
 *
 * Hits all 18 API endpoints used by loadSSPFromBackend() against the staging
 * environment. Verifies data completeness and ISSO review progress.
 *
 * Usage:
 *   node scripts/promote/validate-staging.cjs \
 *     --ssp-id <uuid> \
 *     --api-url https://forge-comply360-api-demo.stanley-riley.workers.dev \
 *     --token <jwt>
 *
 * Exit codes:
 *   0 = all critical checks pass
 *   1 = one or more critical checks failed
 */

const fs = require('fs');
const path = require('path');

const MAX_RETRIES = 3;
const RATE_LIMIT_MS = 200;

// All 18 endpoints from src/services/sspMapper.ts:257-275
const ENDPOINTS = [
  { path: '',                        key: 'document',                 type: 'object',  critical: false, label: 'SSP Document' },
  { path: '/info-types',             key: 'info_types',               type: 'array',   critical: false, label: 'Info Types' },
  { path: '/rmf-tracking',           key: 'rmf_tracking',             type: 'object',  critical: false, label: 'RMF Tracking' },
  { path: '/ports-protocols',        key: 'ports_protocols',          type: 'array',   critical: false, label: 'Ports & Protocols' },
  { path: '/crypto-modules',         key: 'crypto_modules',           type: 'array',   critical: false, label: 'Crypto Modules' },
  { path: '/digital-identity',       key: 'digital_identity',         type: 'object',  critical: false, label: 'Digital Identity' },
  { path: '/separation-duties',      key: 'separation_duties',        type: 'array',   critical: false, label: 'Separation of Duties' },
  { path: '/policy-mappings',        key: 'policy_mappings',          type: 'array',   critical: false, label: 'Policy Mappings' },
  { path: '/scrm',                   key: 'scrm_entries',             type: 'array',   critical: false, label: 'SCRM Entries' },
  { path: '/scrm-plan',              key: 'scrm_plan',                type: 'object',  critical: false, label: 'SCRM Plan' },
  { path: '/privacy-analysis',       key: 'privacy_analysis',         type: 'object',  critical: false, label: 'Privacy Analysis' },
  { path: '/config-management',      key: 'config_management',        type: 'object',  critical: false, label: 'Config Management' },
  { path: '/cm-baselines',           key: 'cm_baselines',             type: 'array',   critical: false, label: 'CM Baselines' },
  { path: '/poam-summary',           key: 'poam_summary',             type: 'object',  critical: false, label: 'POA&M Summary' },
  { path: '/control-implementations', key: 'control_implementations', type: 'array',   critical: true,  label: 'Control Implementations' },
  { path: '/assets',                 key: 'assets',                   type: 'array',   critical: true,  label: 'Assets' },
  { path: '/vulnerability-findings', key: 'vulnerability_findings',   type: 'array',   critical: true,  label: 'Vulnerability Findings' },
  { path: '/poam-items',             key: 'poam_items',               type: 'array',   critical: true,  label: 'POA&M Items' },
];

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { sspId: null, apiUrl: null, token: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--ssp-id': opts.sspId = args[++i]; break;
      case '--api-url': opts.apiUrl = args[++i]; break;
      case '--token': opts.token = args[++i]; break;
    }
  }

  if (!opts.sspId || !opts.apiUrl || !opts.token) {
    console.error('Usage: node validate-staging.cjs --ssp-id <uuid> --api-url <url> --token <jwt>');
    process.exit(1);
  }

  return opts;
}

// ============================================================================
// API helpers
// ============================================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEndpoint(apiUrl, sspId, token, endpoint) {
  const url = `${apiUrl}/api/v1/ssp/${sspId}${endpoint.path}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.status === 429) {
        await sleep(Math.pow(2, attempt + 1) * 1000);
        continue;
      }

      if (!res.ok) {
        return { endpoint, status: res.status, ok: false, data: null, error: `HTTP ${res.status}` };
      }

      const data = await res.json();
      return { endpoint, status: res.status, ok: true, data };
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, attempt + 1) * 1000);
      } else {
        return { endpoint, status: 0, ok: false, data: null, error: err.message };
      }
    }
  }
}

function getItemCount(result) {
  if (!result.ok || !result.data) return 0;
  const val = result.data[result.endpoint.key];
  if (Array.isArray(val)) return val.length;
  if (val && typeof val === 'object') return 1;
  return 0;
}

function hasData(result) {
  return getItemCount(result) > 0;
}

// ============================================================================
// ISSO review check
// ============================================================================

function checkISSOReview(controlImplResult) {
  if (!controlImplResult.ok || !controlImplResult.data) {
    return { total: 0, approved: 0, pending: 0, rejected: 0, needsRevision: 0, pct: 0 };
  }

  const items = controlImplResult.data.control_implementations || [];
  const total = items.length;
  const approved = items.filter(i => i.review_status === 'approved').length;
  const pending = items.filter(i => i.review_status === 'pending').length;
  const rejected = items.filter(i => i.review_status === 'rejected').length;
  const needsRevision = items.filter(i => i.review_status === 'needs-revision').length;
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

  return { total, approved, pending, rejected, needsRevision, pct };
}

// ============================================================================
// Main
// ============================================================================

async function validate(opts) {
  const { sspId, apiUrl, token } = opts;
  console.log(`Validating staging: ${apiUrl}/api/v1/ssp/${sspId}`);
  console.log(`Checking ${ENDPOINTS.length} endpoints...\n`);

  const results = [];
  for (const ep of ENDPOINTS) {
    const result = await fetchEndpoint(apiUrl, sspId, token, ep);
    results.push(result);
    await sleep(RATE_LIMIT_MS);
  }

  // Print results
  let criticalFailures = 0;
  let warnings = 0;

  console.log('Endpoint Results:');
  console.log('-'.repeat(72));

  for (const r of results) {
    const count = getItemCount(r);
    const has = hasData(r);
    const isCritical = r.endpoint.critical;

    let status;
    if (!r.ok) {
      status = `FAIL (${r.error})`;
      if (isCritical) criticalFailures++;
    } else if (isCritical && !has) {
      status = 'FAIL (empty — critical)';
      criticalFailures++;
    } else if (!has) {
      status = 'WARN (empty)';
      warnings++;
    } else {
      status = `OK (${count} ${r.endpoint.type === 'array' ? 'items' : 'record'})`;
    }

    const marker = isCritical ? '*' : ' ';
    console.log(`  ${marker} ${r.endpoint.label.padEnd(28)} ${status}`);
  }

  console.log('-'.repeat(72));
  console.log('  * = critical (must have data)\n');

  // ISSO review check
  const ctrlResult = results.find(r => r.endpoint.key === 'control_implementations');
  const review = checkISSOReview(ctrlResult);

  console.log('ISSO Review Status:');
  console.log(`  Total controls:    ${review.total}`);
  console.log(`  Approved:          ${review.approved} (${review.pct}%)`);
  console.log(`  Pending:           ${review.pending}`);
  console.log(`  Rejected:          ${review.rejected}`);
  console.log(`  Needs revision:    ${review.needsRevision}`);

  if (review.pct < 100) {
    console.log(`  WARNING: ISSO review not 100% complete (${review.pct}%)`);
    warnings++;
  }

  // Summary
  console.log(`\nSummary: ${criticalFailures} critical failures, ${warnings} warnings`);

  // Save report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const report = {
    timestamp: new Date().toISOString(),
    apiUrl,
    sspId,
    endpoints: results.map(r => ({
      label: r.endpoint.label,
      path: r.endpoint.path,
      critical: r.endpoint.critical,
      ok: r.ok,
      httpStatus: r.status,
      itemCount: getItemCount(r),
      error: r.error || null,
    })),
    issoReview: review,
    criticalFailures,
    warnings,
    passed: criticalFailures === 0,
  };

  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `staging-validation-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${outPath}`);

  if (criticalFailures > 0) {
    console.log('\nFAILED: Critical checks did not pass. Do not proceed with promotion.');
    process.exit(1);
  } else {
    console.log('\nPASSED: All critical checks passed. Safe to proceed with promotion.');
  }

  return report;
}

// Allow use as module or CLI
if (require.main === module) {
  const opts = parseArgs();
  validate(opts).catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { validate, ENDPOINTS, fetchEndpoint, getItemCount };
