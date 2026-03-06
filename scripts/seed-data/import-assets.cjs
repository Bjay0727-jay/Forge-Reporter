#!/usr/bin/env node
/**
 * Phase 3: Asset Inventory Import
 *
 * Parses real asset inventory data (CSV or JSON) from CMDB or cloud
 * console exports and generates D1 SQL + JSON for the ForgeComply 360
 * backend.
 *
 * Supported input formats:
 *   - CSV: name,type,os,ip,fqdn,location,owner,baseline
 *   - JSON: Array of { name, type, os, ip, fqdn, location, owner, baseline }
 *   - AWS EC2 describe-instances JSON export
 *
 * Usage:
 *   node scripts/seed-data/import-assets.cjs \
 *     --input inventory.csv \
 *     --format csv \
 *     --ssp-id <uuid>
 *
 * Outputs:
 *   scripts/seed-data/output/assets.json
 *   scripts/seed-data/output/assets.sql
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'output');
const BATCH_SIZE = 50;

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: null, format: 'csv', sspId: '<SSP_ID>' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input': opts.input = args[++i]; break;
      case '--format': opts.format = args[++i]; break;
      case '--ssp-id': opts.sspId = args[++i]; break;
    }
  }

  if (!opts.input) {
    console.error('Usage: node import-assets.cjs --input <file> [--format csv|json|aws-ec2] [--ssp-id <uuid>]');
    process.exit(1);
  }

  return opts;
}

// ============================================================================
// Parsers
// ============================================================================

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const assets = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() || ''; });

    assets.push({
      asset_id: row.asset_id || row.id || `A-${String(i).padStart(3, '0')}`,
      name: row.name || row.hostname || '',
      asset_type: row.type || row.asset_type || 'Other',
      owner: row.owner || '',
      location: row.location || row.region || '',
      operating_system: row.os || row.operating_system || '',
      fqdn: row.fqdn || row.dns || '',
      ip_address: row.ip || row.ip_address || '',
      open_ports: row.ports || row.open_ports || '',
      baseline: row.baseline || row.stig || '',
      last_scan_date: row.scan_date || row.last_scan_date || '',
    });
  }

  return assets.filter((a) => a.name);
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseJSON(content) {
  const data = JSON.parse(content);
  if (Array.isArray(data)) {
    return data.map((item, i) => ({
      asset_id: item.asset_id || item.id || `A-${String(i + 1).padStart(3, '0')}`,
      name: item.name || item.hostname || '',
      asset_type: item.type || item.asset_type || 'Other',
      owner: item.owner || '',
      location: item.location || item.region || '',
      operating_system: item.os || item.operating_system || '',
      fqdn: item.fqdn || item.dns || '',
      ip_address: item.ip || item.ip_address || '',
      open_ports: item.ports || item.open_ports || '',
      baseline: item.baseline || '',
      last_scan_date: item.scan_date || item.last_scan_date || '',
    })).filter((a) => a.name);
  }
  return [];
}

function parseAWSEC2(content) {
  const data = JSON.parse(content);
  const reservations = data.Reservations || [];
  const assets = [];
  let idx = 1;

  for (const res of reservations) {
    for (const inst of (res.Instances || [])) {
      const nameTag = (inst.Tags || []).find((t) => t.Key === 'Name');
      assets.push({
        asset_id: `EC2-${String(idx++).padStart(3, '0')}`,
        name: nameTag?.Value || inst.InstanceId,
        asset_type: 'Cloud',
        owner: '',
        location: inst.Placement?.AvailabilityZone || '',
        operating_system: inst.PlatformDetails || inst.Platform || 'Linux',
        fqdn: inst.PublicDnsName || inst.PrivateDnsName || '',
        ip_address: inst.PrivateIpAddress || '',
        open_ports: '',
        baseline: `Instance Type: ${inst.InstanceType}`,
        last_scan_date: '',
      });
    }
  }

  return assets;
}

// ============================================================================
// SQL generation
// ============================================================================

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function generateSQL(assets, sspId) {
  const batchId = `seed-phase3-assets-${new Date().toISOString().slice(0, 10)}`;
  const lines = [
    `-- Phase 3: Asset Inventory Import`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Batch ID: ${batchId}`,
    `-- Total: ${assets.length} assets`,
    '',
  ];

  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = assets.slice(i, i + BATCH_SIZE);
    lines.push(`-- Batch ${Math.floor(i / BATCH_SIZE) + 1}`);

    for (const a of batch) {
      lines.push(
        `INSERT OR IGNORE INTO assets (ssp_id, asset_id, name, asset_type, owner, location, operating_system, fqdn, ip_address, open_ports, baseline, last_scan_date, batch_id) VALUES ('${escapeSQL(sspId)}', '${escapeSQL(a.asset_id)}', '${escapeSQL(a.name)}', '${escapeSQL(a.asset_type)}', '${escapeSQL(a.owner)}', '${escapeSQL(a.location)}', '${escapeSQL(a.operating_system)}', '${escapeSQL(a.fqdn)}', '${escapeSQL(a.ip_address)}', '${escapeSQL(a.open_ports)}', '${escapeSQL(a.baseline)}', '${escapeSQL(a.last_scan_date)}', '${escapeSQL(batchId)}');`
      );
    }
    lines.push('');
  }

  lines.push(`-- ROLLBACK: DELETE FROM assets WHERE batch_id = '${batchId}';`);
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
  let assets;

  switch (opts.format) {
    case 'csv': assets = parseCSV(content); break;
    case 'json': assets = parseJSON(content); break;
    case 'aws-ec2': assets = parseAWSEC2(content); break;
    default:
      console.error(`Unknown format: ${opts.format}. Use csv, json, or aws-ec2.`);
      process.exit(1);
  }

  console.log(`Parsed ${assets.length} assets from ${opts.format} input`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const jsonPath = path.join(OUTPUT_DIR, 'assets.json');
  const sqlPath = path.join(OUTPUT_DIR, 'assets.sql');

  fs.writeFileSync(jsonPath, JSON.stringify(assets, null, 2));
  fs.writeFileSync(sqlPath, generateSQL(assets, opts.sspId));

  console.log(`\nOutput:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  SQL:  ${sqlPath}`);

  // Summary by type
  const byType = {};
  for (const a of assets) {
    byType[a.asset_type] = (byType[a.asset_type] || 0) + 1;
  }
  console.log(`\nAssets by type:`);
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }
}

main();
