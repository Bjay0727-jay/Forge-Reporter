#!/usr/bin/env node
/**
 * Phase 2: Control Implementation Narrative Generator
 *
 * Generates FedRAMP-quality implementation narratives for each control
 * in the FedRAMP Moderate baseline using the Claude API and a verified
 * system profile.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/seed-narratives/generate-narratives.cjs \
 *     --profile profiles/mfehr.json \
 *     [--controls path/to/controls.json] \
 *     [--resume]
 *
 * Outputs:
 *   scripts/seed-narratives/output/<system_name>_control_implementations.json
 *   scripts/seed-narratives/output/<system_name>_control_implementations.sql
 *
 * Requirements:
 *   - ANTHROPIC_API_KEY environment variable set
 *   - System profile JSON verified and signed off by system owner
 *   - Phase 1 catalog output (validation.json) for control list
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'output');
const CATALOG_VALIDATION = path.join(SCRIPT_DIR, '..', 'seed-catalog', 'output', 'validation.json');

const BATCH_SIZE = 50;
const RATE_LIMIT_MS = 1200; // 1.2s between requests to stay under rate limits
const MAX_RETRIES = 3;

// FedRAMP Moderate baseline families and approximate control counts
const FEDRAMP_MODERATE_FAMILIES = [
  'AC', 'AT', 'AU', 'CA', 'CM', 'CP', 'IA', 'IR', 'MA', 'MP',
  'PE', 'PL', 'PM', 'PS', 'PT', 'RA', 'SA', 'SC', 'SI', 'SR',
];

// Management families (shorter narratives acceptable)
const MANAGEMENT_FAMILIES = ['AT', 'PL', 'PM', 'PS', 'PT'];
const MIN_WORDS_MANAGEMENT = 80;
const MIN_WORDS_TECHNICAL = 150;

// ============================================================================
// CLI argument parsing
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { profile: null, controls: null, resume: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' && args[i + 1]) {
      opts.profile = args[++i];
    } else if (args[i] === '--controls' && args[i + 1]) {
      opts.controls = args[++i];
    } else if (args[i] === '--resume') {
      opts.resume = true;
    }
  }

  if (!opts.profile) {
    console.error('Usage: node generate-narratives.cjs --profile <path> [--controls <path>] [--resume]');
    process.exit(1);
  }

  return opts;
}

// ============================================================================
// Load data
// ============================================================================

function loadProfile(profilePath) {
  const fullPath = path.resolve(SCRIPT_DIR, profilePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Profile not found: ${fullPath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function loadControlList(controlsPath) {
  // Try explicit controls file first
  if (controlsPath) {
    const fullPath = path.resolve(controlsPath);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    }
  }

  // Fall back to Phase 1 catalog output
  if (fs.existsSync(CATALOG_VALIDATION)) {
    const validation = JSON.parse(fs.readFileSync(CATALOG_VALIDATION, 'utf-8'));
    // Extract moderate baseline controls
    if (validation.moderate_baseline_controls) {
      return validation.moderate_baseline_controls;
    }
    // Fall back to all controls
    if (validation.controls) {
      return validation.controls;
    }
  }

  // Generate a default list of FedRAMP Moderate controls
  console.warn('No control list found. Generating default FedRAMP Moderate control IDs.');
  return generateDefaultControlList();
}

function generateDefaultControlList() {
  const controls = [];
  const familyCounts = {
    AC: 25, AT: 6, AU: 16, CA: 9, CM: 14, CP: 13, IA: 12, IR: 10,
    MA: 7, MP: 8, PE: 20, PL: 11, PM: 32, PS: 9, PT: 8, RA: 10,
    SA: 23, SC: 44, SI: 23, SR: 12,
  };

  for (const [family, count] of Object.entries(familyCounts)) {
    for (let i = 1; i <= count; i++) {
      controls.push({
        control_id: `${family}-${i}`,
        family: family,
        title: `${family}-${i}`,
      });
    }
  }
  return controls;
}

// ============================================================================
// Claude API client (minimal, no SDK dependency)
// ============================================================================

async function callClaude(prompt, systemPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.warn(`  Rate limited. Waiting ${waitMs / 1000}s...`);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Claude API ${res.status}: ${errText}`);
      }

      const data = await res.json();
      return data.content[0].text;
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.warn(`  Retry ${attempt + 1}/${MAX_RETRIES} after error: ${err.message}. Waiting ${waitMs / 1000}s...`);
        await sleep(waitMs);
      } else {
        throw err;
      }
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Narrative generation
// ============================================================================

function buildSystemPrompt(profile) {
  return `You are a FedRAMP compliance expert writing control implementation narratives for the ${profile.system_name} system.

System Profile:
- Name: ${profile.system_name}
- Description: ${profile.description}
- Hosting: ${profile.hosting}
- Authentication: ${profile.auth}
- Key Technologies: ${profile.key_technologies.join(', ')}

Write implementation narratives following the FedRAMP pattern:
1. WHAT is done (specific technical mechanism or process)
2. WHO is responsible (role, not individual name)
3. POLICY reference (cite actual policy document IDs from this system)
4. HOW it is technically implemented (specific technologies, configurations)
5. WHEN / how often (frequency, trigger, or schedule)

Requirements:
- Reference ACTUAL technologies from the system profile above
- Cite ACTUAL policy document IDs (e.g., POL-AC-001 v3.2)
- Be specific to THIS system, not generic best-practice
- Use present tense ("The system implements..." not "The system should implement...")
- Do NOT include the control ID or title in the narrative text
- Output ONLY the narrative text, no headers or formatting`;
}

function buildControlPrompt(controlId, profile) {
  const family = controlId.split('-')[0];
  const isManagement = MANAGEMENT_FAMILIES.includes(family);
  const minWords = isManagement ? MIN_WORDS_MANAGEMENT : MIN_WORDS_TECHNICAL;

  // Find relevant policy for this family
  const policyPrefix = `POL-${family}-`;
  const relevantPolicy = profile.policy_documents.find((p) => p.id.startsWith(policyPrefix));
  const policyRef = relevantPolicy
    ? `${relevantPolicy.id} (${relevantPolicy.title} v${relevantPolicy.version})`
    : `the organization's ${family} policy`;

  return `Write an implementation narrative for NIST 800-53 Rev 5 control ${controlId} as implemented in the ${profile.system_name} system.

Reference policy: ${policyRef}
Minimum length: ${minWords} words

The narrative must be specific to ${profile.system_name} running on ${profile.hosting} using ${profile.key_technologies.slice(0, 3).join(', ')}.`;
}

// ============================================================================
// SQL generation
// ============================================================================

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function generateSQL(implementations, profile) {
  const batchId = `seed-phase2-${profile.system_name.toLowerCase()}-${new Date().toISOString().slice(0, 10)}`;
  const lines = [
    `-- Phase 2: Control Implementation Narratives for ${profile.system_name}`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Batch ID: ${batchId}`,
    `-- Status: ALL narratives are DRAFTS pending ISSO review`,
    `-- Total: ${implementations.length} controls`,
    '',
    `-- Replace <SSP_ID> with the actual SSP UUID before execution`,
    '',
  ];

  for (let i = 0; i < implementations.length; i += BATCH_SIZE) {
    const batch = implementations.slice(i, i + BATCH_SIZE);
    lines.push(`-- Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(implementations.length / BATCH_SIZE)}`);

    for (const impl of batch) {
      lines.push(
        `INSERT OR IGNORE INTO control_implementations (ssp_id, control_id, status, implementation_narrative, responsibility, batch_id, review_status) VALUES ('<SSP_ID>', '${escapeSQL(impl.control_id)}', '${escapeSQL(impl.status)}', '${escapeSQL(impl.implementation_narrative)}', '${escapeSQL(impl.responsibility)}', '${escapeSQL(batchId)}', 'pending');`
      );
    }
    lines.push('');
  }

  // Rollback script
  lines.push('-- ROLLBACK: To remove all narratives from this batch:');
  lines.push(`-- DELETE FROM control_implementations WHERE batch_id = '${batchId}';`);

  return lines.join('\n');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const opts = parseArgs();
  const profile = loadProfile(opts.profile);
  const controls = loadControlList(opts.controls);

  console.log(`System: ${profile.system_name}`);
  console.log(`Controls to generate: ${controls.length}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputJsonPath = path.join(OUTPUT_DIR, `${profile.system_name.toLowerCase()}_control_implementations.json`);
  const outputSqlPath = path.join(OUTPUT_DIR, `${profile.system_name.toLowerCase()}_control_implementations.sql`);

  // Resume support: load existing progress
  let implementations = [];
  const completedIds = new Set();
  if (opts.resume && fs.existsSync(outputJsonPath)) {
    implementations = JSON.parse(fs.readFileSync(outputJsonPath, 'utf-8'));
    for (const impl of implementations) {
      completedIds.add(impl.control_id);
    }
    console.log(`Resuming: ${completedIds.size} controls already generated`);
  }

  const systemPrompt = buildSystemPrompt(profile);
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const ctrl of controls) {
    const controlId = ctrl.control_id || ctrl;
    const family = controlId.split('-')[0];

    // Skip if not in FedRAMP Moderate families
    if (!FEDRAMP_MODERATE_FAMILIES.includes(family)) {
      skipped++;
      continue;
    }

    // Skip if already generated (resume mode)
    if (completedIds.has(controlId)) {
      continue;
    }

    try {
      const prompt = buildControlPrompt(controlId, profile);
      console.log(`  [${generated + 1}] Generating ${controlId}...`);
      const narrative = await callClaude(prompt, systemPrompt);

      implementations.push({
        control_id: controlId,
        status: 'planned',
        implementation_narrative: narrative.trim(),
        responsibility: 'shared',
        review_status: 'pending',
      });

      generated++;

      // Save progress every 10 controls
      if (generated % 10 === 0) {
        fs.writeFileSync(outputJsonPath, JSON.stringify(implementations, null, 2));
        console.log(`  Progress saved: ${implementations.length} total`);
      }

      // Rate limiting
      await sleep(RATE_LIMIT_MS);
    } catch (err) {
      console.error(`  ERROR generating ${controlId}: ${err.message}`);
      errors++;
      // Continue to next control
    }
  }

  // Final save
  fs.writeFileSync(outputJsonPath, JSON.stringify(implementations, null, 2));
  fs.writeFileSync(outputSqlPath, generateSQL(implementations, profile));

  console.log('\n--- Generation Complete ---');
  console.log(`Generated: ${generated}`);
  console.log(`Resumed:   ${completedIds.size}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Errors:    ${errors}`);
  console.log(`Total:     ${implementations.length}`);
  console.log(`\nJSON: ${outputJsonPath}`);
  console.log(`SQL:  ${outputSqlPath}`);
  console.log('\nIMPORTANT: All narratives are DRAFTS. 100% ISSO review required before production.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
