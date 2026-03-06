# Production Promotion Toolkit

Scripts and templates for promoting validated staging data to production,
following the 8-step change management process from the
[Control Seeding Implementation Plan](../../Control_Seeding_Implementation_Plan_REVISED.md).

## Workflow

```
1. Validate Staging  ──>  2. Change Request  ──>  3. CCB Approval
       │                        │
       v                        v
4. Backup Production  ──>  5. Promote  ──>  6. Smoke Test  ──>  7. Changelog
```

### Step 1: Validate Staging

Verify all 18 API endpoints return data and ISSO reviews are complete:

```bash
node scripts/promote/validate-staging.cjs \
  --ssp-id <uuid> \
  --api-url https://forge-comply360-api-demo.stanley-riley.workers.dev \
  --token <jwt>
```

Outputs: `output/staging-validation-<timestamp>.json`

### Step 2: Prepare Change Request

Copy `templates/change-request.md`, fill in:
- System name and SSP ID
- Staging row counts from validation report
- Paste staging validation output as evidence

### Step 3: Get CCB Approval

Submit change request for ISSO, System Owner, and CCB Chair signatures.
Do not proceed until all approvals are obtained.

### Step 4: Backup Production

Capture current production state before deploying:

```bash
node scripts/promote/backup-production.cjs \
  --ssp-id <uuid> \
  --api-url https://forge-comply360-api.stanley-riley.workers.dev \
  --token <jwt> \
  --batch-id seed-phase4-2026-03-06
```

Outputs:
- `output/backup-<timestamp>.json` (row counts)
- `output/rollback-<timestamp>.sql` (rollback statements)

### Step 5: Promote to Production

Deploy seeded data. Use `--dry-run` first:

```bash
# Preview what would be deployed
node scripts/promote/promote-to-production.cjs \
  --ssp-id <uuid> \
  --api-url https://forge-comply360-api.stanley-riley.workers.dev \
  --staging-url https://forge-comply360-api-demo.stanley-riley.workers.dev \
  --token <jwt> \
  --data-dir scripts/seed-data/output \
  --narratives-dir scripts/seed-narratives/output \
  --dry-run

# Execute for real
node scripts/promote/promote-to-production.cjs \
  --ssp-id <uuid> \
  --api-url https://forge-comply360-api.stanley-riley.workers.dev \
  --staging-url https://forge-comply360-api-demo.stanley-riley.workers.dev \
  --token <jwt> \
  --data-dir scripts/seed-data/output \
  --narratives-dir scripts/seed-narratives/output \
  --confirm
```

Outputs: `output/deployment-<timestamp>.json` (deployment receipt)

### Step 6: Smoke Test Production

Verify production data is accessible:

```bash
node scripts/promote/smoke-test.cjs \
  --ssp-id <uuid> \
  --api-url https://forge-comply360-api.stanley-riley.workers.dev \
  --token <jwt> \
  --staging-report output/staging-validation-*.json
```

Outputs: `output/smoke-test-<timestamp>.json`

### Step 7: Generate Change Log

Document the deployment:

```bash
node scripts/promote/generate-changelog.cjs \
  --receipt output/deployment-<timestamp>.json \
  --approver "Jane Smith <j.smith@agency.gov>"
```

Outputs: appends to `output/CHANGELOG.md`

### Step 8: Archive Artifacts

Keep the `output/` directory contents for audit trail:
- Staging validation report
- Pre-deployment backup
- Rollback SQL
- Deployment receipt
- Smoke test results
- Change log

## Rollback

If something goes wrong after promotion:

1. **Batch rollback** — Run the SQL from `output/rollback-<timestamp>.sql`
2. **Full restore** — Restore from pre-deployment D1 snapshot

## Script Dependencies

All scripts use Node.js built-in `fetch` (Node 18+) with no external dependencies.
Scripts can be imported as modules for composition (e.g., promote imports validate + backup).
