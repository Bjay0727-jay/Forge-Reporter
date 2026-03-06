#!/usr/bin/env node
/**
 * Phase 3: Vulnerability Finding Import
 *
 * Parses real vulnerability scan exports (Nessus CSV, Qualys CSV)
 * and generates D1 SQL + JSON for the ForgeComply 360 backend.
 *
 * Usage:
 *   node scripts/seed-data/import-vulns.cjs \
 *     --input scan-results.csv \
 *     --format nessus-csv \
 *     --ssp-id <uuid>
 *
 * Supported formats:
 *   - nessus-csv: Nessus CSV export (Plugin ID, CVE, Name, Synopsis, Risk, Host)
 *   - qualys-csv: Qualys CSV export (QID, CVE, Title, Severity, IP)
 *   - json:       Generic JSON array
 *
 * Outputs:
 *   scripts/seed-data/output/vulnerability_findings.json
 *   scripts/seed-data/output/vulnerability_findings.sql
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'output');
const BATCH_SIZE = 50;

// CVE to NIST control family mapping (simplified)
const CVE_CONTROL_MAP = {
  'authentication': 'IA',
  'access control': 'AC',
  'audit': 'AU',
  'encryption': 'SC',
  'certificate': 'SC',
  'tls': 'SC',
  'ssl': 'SC',
  'configuration': 'CM',
  'patch': 'SI',
  'update': 'SI',
  'buffer overflow': 'SI',
  'injection': 'SI',
  'xss': 'SI',
  'privilege': 'AC',
  'backup': 'CP',
  'logging': 'AU',
};

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: null, format: 'nessus-csv', sspId: '<SSP_ID>' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input': opts.input = args[++i]; break;
      case '--format': opts.format = args[++i]; break;
      case '--ssp-id': opts.sspId = args[++i]; break;
    }
  }

  if (!opts.input) {
    console.error('Usage: node import-vulns.cjs --input <file> [--format nessus-csv|qualys-csv|json] [--ssp-id <uuid>]');
    process.exit(1);
  }

  return opts;
}

// ============================================================================
// Parsers
// ============================================================================

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function mapSeverity(risk) {
  const r = (risk || '').toLowerCase();
  if (r === 'critical' || r === '4') return 'Critical';
  if (r === 'high' || r === '3') return 'High';
  if (r === 'medium' || r === '2') return 'Medium';
  if (r === 'low' || r === '1') return 'Low';
  if (r === 'none' || r === '0' || r === 'info') return 'Info';
  return 'Medium';
}

function guessControlFamily(title) {
  const lower = (title || '').toLowerCase();
  for (const [keyword, family] of Object.entries(CVE_CONTROL_MAP)) {
    if (lower.includes(keyword)) return family;
  }
  return 'SI'; // Default to System & Info Integrity
}

function parseNessusCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const findings = [];

  // Common Nessus CSV headers: Plugin ID, CVE, CVSS, Risk, Host, Protocol, Port, Name, Synopsis
  const colIdx = {
    pluginId: headers.indexOf('plugin id') >= 0 ? headers.indexOf('plugin id') : headers.indexOf('pluginid'),
    cve: headers.indexOf('cve'),
    risk: headers.indexOf('risk'),
    host: headers.indexOf('host'),
    name: headers.indexOf('name'),
    port: headers.indexOf('port'),
  };

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const risk = values[colIdx.risk] || '';

    // Skip informational findings
    if (risk.toLowerCase() === 'none' || risk.toLowerCase() === 'info') continue;

    const title = values[colIdx.name] || '';
    findings.push({
      finding_id: `VF-${String(findings.length + 1).padStart(4, '0')}`,
      plugin_id: values[colIdx.pluginId] || '',
      cve: values[colIdx.cve] || '',
      title: title,
      severity: mapSeverity(risk),
      asset: values[colIdx.host] || '',
      status: 'Open',
      detected: new Date().toISOString().slice(0, 10),
      due: calculateDueDate(mapSeverity(risk)),
      control_family: guessControlFamily(title),
    });
  }

  return findings;
}

function parseQualysCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const findings = [];

  const colIdx = {
    qid: headers.indexOf('qid'),
    cve: headers.indexOf('cve id') >= 0 ? headers.indexOf('cve id') : headers.indexOf('cve'),
    title: headers.indexOf('title'),
    severity: headers.indexOf('severity'),
    ip: headers.indexOf('ip') >= 0 ? headers.indexOf('ip') : headers.indexOf('host'),
  };

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const sev = values[colIdx.severity] || '';
    if (sev === '1' || sev.toLowerCase() === 'info') continue;

    const title = values[colIdx.title] || '';
    findings.push({
      finding_id: `VF-${String(findings.length + 1).padStart(4, '0')}`,
      plugin_id: values[colIdx.qid] || '',
      cve: values[colIdx.cve] || '',
      title: title,
      severity: mapSeverity(sev),
      asset: values[colIdx.ip] || '',
      status: 'Open',
      detected: new Date().toISOString().slice(0, 10),
      due: calculateDueDate(mapSeverity(sev)),
      control_family: guessControlFamily(title),
    });
  }

  return findings;
}

function parseGenericJSON(content) {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) return [];

  return data.map((item, i) => ({
    finding_id: item.finding_id || `VF-${String(i + 1).padStart(4, '0')}`,
    plugin_id: item.plugin_id || item.pluginId || '',
    cve: item.cve || '',
    title: item.title || item.name || '',
    severity: mapSeverity(item.severity || item.risk || ''),
    asset: item.asset || item.host || item.ip || '',
    status: item.status || 'Open',
    detected: item.detected || item.detected_date || new Date().toISOString().slice(0, 10),
    due: item.due || calculateDueDate(mapSeverity(item.severity || '')),
    control_family: item.control_family || guessControlFamily(item.title || ''),
  })).filter((f) => f.title);
}

function calculateDueDate(severity) {
  const days = { Critical: 30, High: 90, Medium: 180, Low: 365 };
  const d = new Date();
  d.setDate(d.getDate() + (days[severity] || 180));
  return d.toISOString().slice(0, 10);
}

// ============================================================================
// SQL generation
// ============================================================================

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function generateSQL(findings, sspId) {
  const batchId = `seed-phase3-vulns-${new Date().toISOString().slice(0, 10)}`;
  const lines = [
    `-- Phase 3: Vulnerability Findings Import`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Batch ID: ${batchId}`,
    `-- Total: ${findings.length} findings`,
    '',
  ];

  for (let i = 0; i < findings.length; i += BATCH_SIZE) {
    const batch = findings.slice(i, i + BATCH_SIZE);
    lines.push(`-- Batch ${Math.floor(i / BATCH_SIZE) + 1}`);

    for (const f of batch) {
      lines.push(
        `INSERT OR IGNORE INTO vulnerability_findings (ssp_id, finding_id, plugin_id, cve, title, severity, asset_id, status, detected_date, due_date, batch_id) VALUES ('${escapeSQL(sspId)}', '${escapeSQL(f.finding_id)}', '${escapeSQL(f.plugin_id)}', '${escapeSQL(f.cve)}', '${escapeSQL(f.title)}', '${escapeSQL(f.severity)}', '${escapeSQL(f.asset)}', '${escapeSQL(f.status)}', '${escapeSQL(f.detected)}', '${escapeSQL(f.due)}', '${escapeSQL(batchId)}');`
      );
    }
    lines.push('');
  }

  lines.push(`-- ROLLBACK: DELETE FROM vulnerability_findings WHERE batch_id = '${batchId}';`);
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

  const content = fs.readFileSync(inputPath, 'utf-8');
  let findings;

  switch (opts.format) {
    case 'nessus-csv': findings = parseNessusCSV(content); break;
    case 'qualys-csv': findings = parseQualysCSV(content); break;
    case 'json': findings = parseGenericJSON(content); break;
    default:
      console.error(`Unknown format: ${opts.format}`);
      process.exit(1);
  }

  console.log(`Parsed ${findings.length} vulnerability findings`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const jsonPath = path.join(OUTPUT_DIR, 'vulnerability_findings.json');
  const sqlPath = path.join(OUTPUT_DIR, 'vulnerability_findings.sql');

  fs.writeFileSync(jsonPath, JSON.stringify(findings, null, 2));
  fs.writeFileSync(sqlPath, generateSQL(findings, opts.sspId));

  console.log(`\nOutput:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  SQL:  ${sqlPath}`);

  // Summary by severity
  const bySev = {};
  for (const f of findings) {
    bySev[f.severity] = (bySev[f.severity] || 0) + 1;
  }
  console.log(`\nFindings by severity:`);
  for (const sev of ['Critical', 'High', 'Medium', 'Low']) {
    if (bySev[sev]) console.log(`  ${sev}: ${bySev[sev]}`);
  }

  // POA&M candidates
  const poamCandidates = findings.filter((f) => f.severity === 'Critical' || f.severity === 'High');
  console.log(`\nPOA&M candidates (Critical + High): ${poamCandidates.length}`);
}

main();
