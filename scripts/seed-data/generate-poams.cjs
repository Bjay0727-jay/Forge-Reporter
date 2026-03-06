#!/usr/bin/env node
/**
 * Phase 3: POA&M Generation from Vulnerability Findings
 *
 * Reads vulnerability_findings.json and generates POA&M items for
 * Critical and High severity findings with FedRAMP-compliant timelines.
 *
 * Usage:
 *   node scripts/seed-data/generate-poams.cjs \
 *     --input output/vulnerability_findings.json \
 *     [--ssp-id <uuid>]
 *
 * Outputs:
 *   scripts/seed-data/output/poams.json
 *   scripts/seed-data/output/poams.sql
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'output');
const BATCH_SIZE = 50;

// FedRAMP remediation timelines
const REMEDIATION_DAYS = {
  Critical: 30,
  High: 90,
  Medium: 180,
  Low: 365,
};

// CVE keyword to NIST control family mapping
const KEYWORD_CONTROL_MAP = {
  'authentication': 'IA-2',
  'password': 'IA-5',
  'access': 'AC-3',
  'privilege': 'AC-6',
  'encryption': 'SC-13',
  'tls': 'SC-8',
  'ssl': 'SC-8',
  'certificate': 'SC-12',
  'configuration': 'CM-6',
  'patch': 'SI-2',
  'update': 'SI-2',
  'vulnerability': 'RA-5',
  'injection': 'SI-10',
  'xss': 'SI-10',
  'buffer': 'SI-16',
  'audit': 'AU-6',
  'log': 'AU-3',
  'backup': 'CP-9',
  'session': 'AC-12',
};

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: null, sspId: '<SSP_ID>' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input': opts.input = args[++i]; break;
      case '--ssp-id': opts.sspId = args[++i]; break;
    }
  }

  if (!opts.input) {
    console.error('Usage: node generate-poams.cjs --input <vulnerability_findings.json> [--ssp-id <uuid>]');
    process.exit(1);
  }

  return opts;
}

// ============================================================================
// POA&M generation
// ============================================================================

function guessControl(title) {
  const lower = (title || '').toLowerCase();
  for (const [keyword, control] of Object.entries(KEYWORD_CONTROL_MAP)) {
    if (lower.includes(keyword)) return control;
  }
  return 'RA-5'; // Default: Vulnerability Monitoring and Scanning
}

function calculateDueDate(severity, detectedDate) {
  const days = REMEDIATION_DAYS[severity] || 180;
  const d = detectedDate ? new Date(detectedDate) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generatePOAMs(findings) {
  // Filter to Critical + High (FedRAMP requires POA&M for these)
  const poamFindings = findings.filter(
    (f) => f.severity === 'Critical' || f.severity === 'High'
  );

  // Group by CVE to avoid duplicate POA&Ms for same vulnerability across hosts
  const byCVE = new Map();
  for (const f of poamFindings) {
    const key = f.cve || f.title || f.finding_id;
    if (!byCVE.has(key)) {
      byCVE.set(key, { ...f, affected_assets: [f.asset] });
    } else {
      byCVE.get(key).affected_assets.push(f.asset);
    }
  }

  const poams = [];
  let idx = 1;

  for (const [, finding] of byCVE) {
    const control = guessControl(finding.title);
    const dueDate = calculateDueDate(finding.severity, finding.detected);
    const assetCount = finding.affected_assets.filter(Boolean).length;

    poams.push({
      id: `V-${String(idx++).padStart(3, '0')}`,
      weakness: finding.title + (finding.cve ? ` (${finding.cve})` : ''),
      sev: finding.severity,
      ctrl: control,
      status: 'Open',
      due: dueDate,
      // Extended fields for tracking
      finding_id: finding.finding_id,
      cve: finding.cve || '',
      affected_asset_count: assetCount,
      milestone: `Remediate within ${REMEDIATION_DAYS[finding.severity]} days per FedRAMP`,
    });
  }

  return poams;
}

// ============================================================================
// SQL generation
// ============================================================================

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function generateSQL(poams, sspId) {
  const batchId = `seed-phase3-poams-${new Date().toISOString().slice(0, 10)}`;
  const lines = [
    `-- Phase 3: POA&M Items Generated from Vulnerability Findings`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Batch ID: ${batchId}`,
    `-- Total: ${poams.length} POA&M items`,
    '',
  ];

  for (let i = 0; i < poams.length; i += BATCH_SIZE) {
    const batch = poams.slice(i, i + BATCH_SIZE);
    lines.push(`-- Batch ${Math.floor(i / BATCH_SIZE) + 1}`);

    for (const p of batch) {
      lines.push(
        `INSERT OR IGNORE INTO poam_items (ssp_id, poam_id, weakness, severity, control, status, due_date, finding_id, cve, milestone, batch_id) VALUES ('${escapeSQL(sspId)}', '${escapeSQL(p.id)}', '${escapeSQL(p.weakness)}', '${escapeSQL(p.sev)}', '${escapeSQL(p.ctrl)}', '${escapeSQL(p.status)}', '${escapeSQL(p.due)}', '${escapeSQL(p.finding_id)}', '${escapeSQL(p.cve)}', '${escapeSQL(p.milestone)}', '${escapeSQL(batchId)}');`
      );
    }
    lines.push('');
  }

  lines.push(`-- ROLLBACK: DELETE FROM poam_items WHERE batch_id = '${batchId}';`);
  return lines.join('\n');
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const opts = parseArgs();
  const inputPath = path.resolve(opts.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const findings = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`Loaded ${findings.length} vulnerability findings`);

  const poams = generatePOAMs(findings);
  console.log(`Generated ${poams.length} POA&M items (Critical + High, deduplicated by CVE)`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const jsonPath = path.join(OUTPUT_DIR, 'poams.json');
  const sqlPath = path.join(OUTPUT_DIR, 'poams.sql');

  fs.writeFileSync(jsonPath, JSON.stringify(poams, null, 2));
  fs.writeFileSync(sqlPath, generateSQL(poams, opts.sspId));

  console.log(`\nOutput:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  SQL:  ${sqlPath}`);

  // Summary
  const bySev = {};
  for (const p of poams) {
    bySev[p.sev] = (bySev[p.sev] || 0) + 1;
  }
  console.log(`\nPOA&M items by severity:`);
  for (const sev of ['Critical', 'High']) {
    if (bySev[sev]) console.log(`  ${sev}: ${bySev[sev]} (${REMEDIATION_DAYS[sev]}-day remediation)`);
  }
}

main();
