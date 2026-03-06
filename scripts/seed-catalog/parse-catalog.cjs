#!/usr/bin/env node
/**
 * Phase 1: NIST 800-53 Rev 5 Control Catalog Seeder
 *
 * Parses the NIST OSCAL catalog JSON and generates SQL INSERT statements
 * for the ForgeComply 360 D1 database (control_definitions table).
 *
 * Usage:
 *   node scripts/seed-catalog/parse-catalog.js
 *
 * Outputs:
 *   scripts/seed-catalog/output/control_definitions.sql  — INSERT OR IGNORE statements
 *   scripts/seed-catalog/output/validation.json          — counts for verification
 *
 * Data sources (must be downloaded first):
 *   scripts/seed-catalog/nist-800-53-rev5-catalog.json       — NIST OSCAL catalog
 *   scripts/seed-catalog/nist-800-53b-low.json               — Low baseline profile
 *   scripts/seed-catalog/nist-800-53b-moderate.json          — Moderate baseline profile
 *   scripts/seed-catalog/nist-800-53b-high.json              — High baseline profile
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'output');

// Framework ID for NIST 800-53 in the existing DB (must match production)
const NIST_FRAMEWORK_ID = 1;
const BATCH_ID = `seed-phase1-${new Date().toISOString().slice(0, 10)}`;
const BATCH_SIZE = 50;

// ============================================================================
// Load OSCAL data
// ============================================================================

function loadJSON(filename) {
  const filepath = path.join(SCRIPT_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.error(`Missing: ${filepath}`);
    console.error('Download with:');
    console.error('  curl -sL "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json" -o scripts/seed-catalog/nist-800-53-rev5-catalog.json');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

// ============================================================================
// Parse baselines
// ============================================================================

function parseBaselineIds(profileJson) {
  const ids = new Set();
  for (const imp of profileJson.profile.imports) {
    for (const inc of imp['include-controls'] || []) {
      for (const id of inc['with-ids'] || []) {
        ids.add(id);
      }
    }
  }
  return ids;
}

// ============================================================================
// Extract control description from OSCAL parts
// ============================================================================

function extractDescription(parts) {
  if (!parts) return '';
  const statements = [];

  for (const part of parts) {
    if (part.name === 'statement') {
      // Collect prose from statement and its sub-items
      if (part.prose) statements.push(part.prose);
      if (part.parts) {
        for (const sub of part.parts) {
          if (sub.prose) statements.push(sub.prose);
          if (sub.parts) {
            for (const subsub of sub.parts) {
              if (subsub.prose) statements.push(subsub.prose);
            }
          }
        }
      }
    }
  }

  // Clean up OSCAL parameter references: {{ insert: param, xxx }} -> [Assignment: xxx]
  let text = statements.join(' ');
  text = text.replace(/\{\{\s*insert:\s*param,\s*([^}]+)\}\}/g, '[Assignment: $1]');
  return text.trim();
}

function extractGuidance(parts) {
  if (!parts) return '';
  const guidance = parts.find(p => p.name === 'guidance');
  if (!guidance?.prose) return '';
  return guidance.prose.trim();
}

// ============================================================================
// Parse catalog into flat control list
// ============================================================================

function parseCatalog(catalogJson, lowIds, modIds, highIds) {
  const controls = [];

  for (const group of catalogJson.catalog.groups) {
    const familyCode = group.id.toUpperCase();
    const familyName = group.title;

    for (const ctrl of group.controls || []) {
      const controlId = ctrl.id.toUpperCase();

      controls.push({
        control_id: controlId,
        family: familyCode,
        family_name: familyName,
        title: ctrl.title,
        description: extractDescription(ctrl.parts),
        guidance: extractGuidance(ctrl.parts),
        class: ctrl.class || 'SP800-53',
        is_enhancement: false,
        parent_control: null,
        baseline_low: lowIds.has(ctrl.id) ? 1 : 0,
        baseline_moderate: modIds.has(ctrl.id) ? 1 : 0,
        baseline_high: highIds.has(ctrl.id) ? 1 : 0,
      });

      // Parse enhancements (nested controls)
      for (const enh of ctrl.controls || []) {
        const enhId = enh.id.toUpperCase();

        controls.push({
          control_id: enhId,
          family: familyCode,
          family_name: familyName,
          title: enh.title,
          description: extractDescription(enh.parts),
          guidance: extractGuidance(enh.parts),
          class: enh.class || 'SP800-53',
          is_enhancement: true,
          parent_control: controlId,
          baseline_low: lowIds.has(enh.id) ? 1 : 0,
          baseline_moderate: modIds.has(enh.id) ? 1 : 0,
          baseline_high: highIds.has(enh.id) ? 1 : 0,
        });
      }
    }
  }

  return controls;
}

// ============================================================================
// Generate SQL
// ============================================================================

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function generateSQL(controls) {
  const lines = [];
  lines.push('-- NIST 800-53 Rev 5 Control Definitions Seeding');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Total controls: ${controls.length}`);
  lines.push(`-- Batch ID: ${BATCH_ID}`);
  lines.push('');
  lines.push('-- Execute in batches of ' + BATCH_SIZE + ' for D1 transaction safety');
  lines.push('');

  // Generate INSERT OR IGNORE statements in batches
  for (let i = 0; i < controls.length; i += BATCH_SIZE) {
    const batch = controls.slice(i, i + BATCH_SIZE);
    lines.push(`-- Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(controls.length / BATCH_SIZE)}`);

    for (const ctrl of batch) {
      lines.push(
        `INSERT OR IGNORE INTO control_definitions (framework_id, control_id, family, title, description, guidance, baseline_low, baseline_moderate, baseline_high, batch_id) VALUES (` +
        `${NIST_FRAMEWORK_ID}, ` +
        `'${escapeSQL(ctrl.control_id)}', ` +
        `'${escapeSQL(ctrl.family)}', ` +
        `'${escapeSQL(ctrl.title)}', ` +
        `'${escapeSQL(ctrl.description)}', ` +
        `'${escapeSQL(ctrl.guidance)}', ` +
        `${ctrl.baseline_low}, ` +
        `${ctrl.baseline_moderate}, ` +
        `${ctrl.baseline_high}, ` +
        `'${BATCH_ID}'` +
        `);`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Generate validation report
// ============================================================================

function generateValidation(controls, lowIds, modIds, highIds) {
  const familyCounts = {};
  let baseControls = 0;
  let enhancements = 0;
  let lowCount = 0;
  let modCount = 0;
  let highCount = 0;

  for (const ctrl of controls) {
    familyCounts[ctrl.family] = (familyCounts[ctrl.family] || 0) + 1;
    if (ctrl.is_enhancement) enhancements++;
    else baseControls++;
    if (ctrl.baseline_low) lowCount++;
    if (ctrl.baseline_moderate) modCount++;
    if (ctrl.baseline_high) highCount++;
  }

  return {
    generated_at: new Date().toISOString(),
    batch_id: BATCH_ID,
    totals: {
      total_controls: controls.length,
      base_controls: baseControls,
      enhancements: enhancements,
      families: Object.keys(familyCounts).length,
    },
    baselines: {
      low: { tagged: lowCount, expected: lowIds.size },
      moderate: { tagged: modCount, expected: modIds.size },
      high: { tagged: highCount, expected: highIds.size },
    },
    by_family: Object.entries(familyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([family, count]) => ({ family, count })),
    validation_queries: [
      `SELECT COUNT(*) AS total FROM control_definitions WHERE framework_id = ${NIST_FRAMEWORK_ID}; -- Expected: ${controls.length}`,
      `SELECT COUNT(*) AS low FROM control_definitions WHERE framework_id = ${NIST_FRAMEWORK_ID} AND baseline_low = 1; -- Expected: ${lowCount}`,
      `SELECT COUNT(*) AS moderate FROM control_definitions WHERE framework_id = ${NIST_FRAMEWORK_ID} AND baseline_moderate = 1; -- Expected: ${modCount}`,
      `SELECT COUNT(*) AS high FROM control_definitions WHERE framework_id = ${NIST_FRAMEWORK_ID} AND baseline_high = 1; -- Expected: ${highCount}`,
      `SELECT family, COUNT(*) AS cnt FROM control_definitions WHERE framework_id = ${NIST_FRAMEWORK_ID} GROUP BY family ORDER BY family;`,
    ],
  };
}

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log('Phase 1: NIST 800-53 Rev 5 Control Catalog Seeder');
  console.log('='.repeat(55));

  // Load data
  console.log('\nLoading OSCAL catalog...');
  const catalog = loadJSON('nist-800-53-rev5-catalog.json');

  console.log('Loading baseline profiles...');
  const lowIds = parseBaselineIds(loadJSON('nist-800-53b-low.json'));
  const modIds = parseBaselineIds(loadJSON('nist-800-53b-moderate.json'));
  const highIds = parseBaselineIds(loadJSON('nist-800-53b-high.json'));

  console.log(`  Low baseline: ${lowIds.size} controls`);
  console.log(`  Moderate baseline: ${modIds.size} controls`);
  console.log(`  High baseline: ${highIds.size} controls`);

  // Parse
  console.log('\nParsing catalog...');
  const controls = parseCatalog(catalog, lowIds, modIds, highIds);

  // Stats
  const families = new Set(controls.map(c => c.family));
  const baseControls = controls.filter(c => !c.is_enhancement);
  const enhancements = controls.filter(c => c.is_enhancement);

  console.log(`  Total: ${controls.length} (${baseControls.length} controls + ${enhancements.length} enhancements)`);
  console.log(`  Families: ${families.size}`);

  // Output
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('\nGenerating SQL...');
  const sql = generateSQL(controls);
  const sqlPath = path.join(OUTPUT_DIR, 'control_definitions.sql');
  fs.writeFileSync(sqlPath, sql);
  console.log(`  Written: ${sqlPath} (${Math.round(sql.length / 1024)} KB)`);

  console.log('\nGenerating validation report...');
  const validation = generateValidation(controls, lowIds, modIds, highIds);
  const validPath = path.join(OUTPUT_DIR, 'validation.json');
  fs.writeFileSync(validPath, JSON.stringify(validation, null, 2));
  console.log(`  Written: ${validPath}`);

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('Family Breakdown:');
  for (const { family, count } of validation.by_family) {
    console.log(`  ${family.padEnd(4)} ${String(count).padStart(4)} controls`);
  }

  console.log('\nBaseline Coverage:');
  console.log(`  Low:      ${validation.baselines.low.tagged} tagged (profile has ${validation.baselines.low.expected})`);
  console.log(`  Moderate: ${validation.baselines.moderate.tagged} tagged (profile has ${validation.baselines.moderate.expected})`);
  console.log(`  High:     ${validation.baselines.high.tagged} tagged (profile has ${validation.baselines.high.expected})`);

  console.log('\nNext steps:');
  console.log('  1. Review output/control_definitions.sql');
  console.log('  2. Execute on staging: wrangler d1 execute forge-comply-360-staging --file=output/control_definitions.sql');
  console.log('  3. Run validation queries from output/validation.json');
  console.log(`  4. Verify batch_id = '${BATCH_ID}' for rollback traceability`);
}

main();
