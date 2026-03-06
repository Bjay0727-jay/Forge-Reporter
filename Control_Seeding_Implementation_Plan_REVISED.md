# Control Data Seeding & Forge Reporter Readiness — REVISED Implementation Plan

**Version 2.0 | March 2026**
**PRODUCTION DEPLOYMENT — FOR ATO/3PAO READINESS**

> This document revises v1.0 of the Control Seeding Implementation Plan based on a
> code-level review of the Forge Reporter frontend and production deployment requirements.
> Changes from v1.0 are marked with **[REVISED]** or **[NEW]**.

---

## 1. Situation Assessment

### 1.1 Current Production State

*(Unchanged from v1.0 — see original document for full gap analysis table)*

Key gaps:
- 585 of 1,189 NIST 800-53 Rev 5 control definitions (604 missing)
- 265 of 325 FedRAMP Moderate baseline tags (60 missing)
- 35 control implementations across 2 of 8 systems (need 325/system)
- 14 POA&Ms, 31 assets, 28 vulnerability findings — all under-populated
- 9 empty non-NIST frameworks

### 1.2 Forge Reporter Dependencies

*(Unchanged from v1.0)*

### 1.3 [NEW] Forge Reporter Frontend Gaps Identified During Review

Code review of the Forge Reporter (React frontend) revealed critical gaps that must be
resolved for seeded data to be visible and usable:

| Gap | Affected Files | Impact |
|-----|---------------|--------|
| **sspMapper.ts has no control implementation sync** — syncs 14 endpoints but `control_implementations` is not among them | `src/services/sspMapper.ts` | Seeded narratives invisible in Connected Mode |
| **Controls.tsx Section 15 is status-only** — dropdown selectors for status, no narrative text fields | `src/sections/Controls.tsx` | ISSO/AO cannot review implementation narratives |
| **ctrlData format mismatch** — Controls.tsx uses `ctrlData[family][controlId] = status` but oscalExport.ts expects `ctrlData[controlId] = { implementation, status }` | `Controls.tsx`, `oscalExport.ts` | OSCAL export produces incorrect/empty control implementations |
| **Hardcoded family counts** — Controls.tsx sums to 312, not 325 per FedRAMP Moderate | `Controls.tsx` | Section 15 shows wrong control count after seeding |
| **security_controls vs control_definitions duplication** — two overlapping tables in D1 | Backend schema | Data integrity risk during seeding |

**Bottom line:** Even after seeding 650+ narratives into `control_implementations`, Forge Reporter
cannot display, edit, or export them without frontend changes.

---

## 2. Implementation Strategy — Revised

The work divides into **five phases** executed over **5-6 weeks**. Phase 0 establishes production
safety. Phase 1 (catalog) and Phase 1.5 (frontend) can run in parallel. Phase 2 (implementations)
requires both to complete. Phase 3 (real data) depends on actual scan/inventory availability.

### 2.0 [NEW] Phase 0: Production Backup & Staging Environment (Week 1)

#### 2.0.1 Objective
Establish production safety controls before any data modifications. Create a staging
D1 database for validation. Document change management procedures.

#### 2.0.2 Tasks

| Task ID | Description | Method | Effort |
|---------|-------------|--------|--------|
| P0-T1 | Export full production D1 database snapshot | Wrangler D1 export or Cloudflare API dump | 2 hrs |
| P0-T2 | Create staging D1 database (clone of production) | `wrangler d1 create forge-staging` + import snapshot | 2 hrs |
| P0-T3 | Document rollback procedures: DELETE scripts scoped by `batch_id` column | SQL scripts with WHERE batch_id = 'seed-v2-YYYYMMDD' | 2 hrs |
| P0-T4 | Add `batch_id` and `seeded_at` columns to target tables (staging first) | D1 ALTER TABLE migration | 1 hr |
| P0-T5 | Document change management process: who approves production pushes | Written procedure: Engineering seeds staging -> ISSO validates -> CCB approves -> production push | 1 hr |
| P0-T6 | Configure Forge Reporter to point at staging D1 for validation | Environment variable or URL parameter swap | 1 hr |

**Exit Criteria:** Production snapshot exists and is restorable. Staging D1 is operational.
Rollback scripts tested on staging. Change management process documented and approved.

---

### 2.1 Phase 1: Complete NIST 800-53 Rev 5 Catalog (Weeks 1-2)

*(Unchanged from v1.0 — 23 hours estimated)*

Tasks P1-T1 through P1-T9 remain as specified. This phase uses authoritative NIST OSCAL
data and is safe for production.

#### [NEW] Additional Task

| Task ID | Description | Method | Effort |
|---------|-------------|--------|--------|
| P1-T10 | Deprecate `security_controls` table — migrate any unique data to `control_definitions`, then DROP or rename to `security_controls_deprecated` | SQL migration with backup | 2 hrs |

**Exit Criteria:** *(Unchanged from v1.0)* + `security_controls` table deprecated.

---

### 2.1.5 [NEW] Phase 1.5: Forge Reporter Frontend Updates (Weeks 1-2, parallel with Phase 1)

#### 2.1.5.1 Objective
Update the Forge Reporter frontend so it can consume, display, and export control
implementation narratives from the backend API.

#### 2.1.5.2 Tasks

| Task ID | Description | Files | Effort |
|---------|-------------|-------|--------|
| P1.5-T1 | **Reconcile ctrlData format** — standardize to flat: `Record<string, { status: string, implementation: string }>`. Update Controls.tsx to read/write flat format. Verify oscalExport.ts compatibility (already expects flat). Update oscalImport.ts. | `src/types/index.ts`, `src/sections/Controls.tsx`, `src/utils/oscalExport.ts`, `src/utils/oscalImport.ts` | 6 hrs |
| P1.5-T2 | **Add control implementation sync to sspMapper.ts** — add 15th parallel fetch for `GET /api/v1/ssp/{id}/control-implementations`. Map backend response to `SSPData.ctrlData`. Add save logic for bidirectional sync. Add to dirty-field detection. | `src/services/sspMapper.ts` | 6 hrs |
| P1.5-T3 | **Add narrative display/edit to Section 15 UI** — expandable control rows show narrative textarea alongside status dropdown. Connected Mode populates from backend. Visual indicator for completeness. | `src/sections/Controls.tsx` | 6 hrs |
| P1.5-T4 | **Make family control counts dynamic** — replace hardcoded counts (sum to 312) with actual counts from API or ctrlData (should be 325 for FedRAMP Moderate). | `src/sections/Controls.tsx` | 2 hrs |
| P1.5-T5 | **Add tests** — unit tests for sspMapper control sync, ctrlData format consistency, OSCAL round-trip (import -> ctrlData -> export preserves data). | New test files in `src/tests/` | 4 hrs |

**Execution Order:** T1 (format) -> T2 (sync) -> T3 (UI) -> T4 (counts) -> T5 (tests)

**Exit Criteria:** Controls.tsx displays narratives from backend. OSCAL export includes
`implemented-requirements` with narratives. All tests pass. Reporter Connected Mode
shows control implementations for systems with seeded data.

---

### 2.2 Phase 2: Seed Control Implementations (Weeks 3-4) [REVISED]

#### 2.2.1 Objective
Generate control implementation records for at least 2 production systems covering
the full FedRAMP Moderate baseline (325 controls each), with **production-quality narratives
suitable for SSP authoring, ISSO review, and 3PAO assessment**.

#### 2.2.2 [REVISED] Narrative Generation Strategy

Each narrative must be **defensible under audit**. AI-generated narratives serve as
**first drafts only** and must pass through a mandatory human review gate.

**Narrative requirements for production:**
1. Reference **actual** technologies deployed in the production system
2. Cite **real** policy document numbers that exist and are version-controlled
3. Describe **actual** configurations, not generic best-practice language
4. Follow FedRAMP narrative pattern: what is done / who is responsible / policy reference / technical mechanism / frequency or trigger
5. Minimum 80 words for management controls, 150 words for technical controls

**Tiered approach:** *(Same as v1.0 — Tier 1 AI-generated, Tier 2 template-based, Tier 3 policy-reference)*

#### 2.2.3 [REVISED] System Profiles — Must Be Verified

The system profiles in Section 2.2.3 of v1.0 (MFEHR on AWS GovCloud with Okta SSO,
FC360 on Cloudflare Workers with JWT) **must be verified against actual production
architecture** before narrative generation begins. Any discrepancy between the profile
and reality will produce narratives that fail 3PAO assessment.

**Action:** System owner signs off on each system profile before narrative generation starts.

#### 2.2.4 [REVISED] Tasks

| Task ID | Description | Method | Effort |
|---------|-------------|--------|--------|
| P2-T1 | Build narrative generation script with verified system profiles | Node.js + Claude API for Tier 1 | 8 hrs |
| P2-T2 | Generate 325 draft narratives for MFEHR system | Script execution | 6 hrs |
| P2-T3 | Generate 325 draft narratives for FC360 system | Script with ForgeComply context | 6 hrs |
| P2-T4 | [REVISED] **Per-control status assessment** — ISSO/system owner assesses each control's actual implementation status. Do NOT use target distribution curve. | Manual assessment with system owner | 8 hrs |
| P2-T5 | Set responsibility distribution (provider/customer/shared) per hosting model | SQL UPDATE per verified architecture | 2 hrs |
| P2-T6 | [REVISED] **100% narrative review** — ISSO/system owner reviews ALL 325 narratives per system. Correct any generic, hallucinated, or inaccurate content. Sign off on each. | Manual review with tracking sheet | 30 hrs |
| P2-T7 | Verify Forge Reporter Section 15 renders all 325 controls with narratives | End-to-end test in Connected Mode (staging) | 2 hrs |
| P2-T8 | [NEW] Verify OSCAL export produces valid `implemented-requirements` with narratives | OSCAL validation with Ajv | 2 hrs |

#### 2.2.5 [REVISED] Implementation Status — Per-Control Assessment

**v1.0 specified a target distribution (60% implemented, 20% partial, etc.). This is
inappropriate for production.** Implementation statuses must reflect actual system state:

- **Implemented:** Control is fully implemented and operational. Evidence exists.
- **Partially Implemented:** Control is in progress. Specific gaps are documented.
- **Planned:** Control implementation is scheduled. Timeline documented.
- **Alternative:** Compensating control is documented and approved.
- **Not Applicable:** Control is scoped out with documented justification.

Each status is determined by the ISSO/system owner during P2-T4, not by a script.

**Exit Criteria:** All 650 narratives reviewed and signed off by ISSO/system owner.
Statuses reflect actual implementation state. OSCAL export validates.

---

### 2.3 Phase 3: Production Data Population (Weeks 4-5) [REVISED]

#### 2.3.1 [REVISED] Objective
Populate assets, vulnerability findings, POA&Ms, and evidence linkages using **actual
production data** — real asset inventories, real scan results, and real findings.
**No synthetic or fabricated data in production.**

#### 2.3.2 Prerequisites [NEW]
Before Phase 3 can begin:
- Actual asset inventory must be available (from CMDB, cloud console exports, or manual inventory)
- At least one vulnerability scan must have been run on each system (Nessus, Qualys, or equivalent)
- If scans haven't been run, schedule them — this is a prerequisite, not something to simulate

#### 2.3.3 [REVISED] Tasks

| Task ID | Description | Method | Effort |
|---------|-------------|--------|--------|
| P3-T1 | [REVISED] Import **actual** assets for MFEHR from CMDB/cloud console export | SQL INSERT from verified inventory data | 4 hrs |
| P3-T2 | [REVISED] Populate open_ports from **actual** network scan or STIG checklist results | UPDATE assets SET open_ports from real scan data | 2 hrs |
| P3-T3 | [REVISED] Import **actual** vulnerability findings from Nessus/Qualys scan exports | Parse .nessus/.csv files using import pipeline | 6 hrs |
| P3-T4 | Generate POA&Ms from **actual** critical+high findings with real milestones | POA&M generation from real findings, milestones set with ISSO | 4 hrs |
| P3-T5 | Link POA&Ms to control_implementations via control_implementation_id | SQL UPDATE after generation | 1 hr |
| P3-T6 | Import vulnerability definitions from NVD for referenced CVEs | Bulk INSERT for CVEs found in actual scans | 2 hrs |
| P3-T7 | [REVISED] Create scan_imports table — **test migration on staging first** | D1 migration SQL, backup before execution, rollback DDL ready | 2 hrs |
| P3-T8 | End-to-end Forge Reporter validation in Connected Mode (staging, then production) | Walk all 23 sections, verify data renders correctly | 6 hrs |

**Exit Criteria:** All data in production represents actual system state. No fabricated
IPs, hostnames, CVEs, or milestones. ISSO signs off on completeness.

---

### 2.4 [NEW] Phase 4: Production Promotion & Change Management (Week 5-6)

#### 2.4.1 Objective
Promote validated staging data to production with full change management.

#### 2.4.2 Tasks

| Task ID | Description | Method | Effort |
|---------|-------------|--------|--------|
| P4-T1 | Final staging validation — all 23 Reporter sections render correctly | Manual walkthrough + OSCAL export test | 4 hrs |
| P4-T2 | CCB/change management approval for production deployment | Submit change request with staging validation evidence | 2 hrs |
| P4-T3 | Production backup (pre-deployment snapshot) | D1 export | 1 hr |
| P4-T4 | Execute seeding scripts against production D1 | Same scripts validated on staging | 4 hrs |
| P4-T5 | Production smoke test — verify Reporter Connected Mode | Walk critical sections (S4, S9, S15, S23) | 2 hrs |
| P4-T6 | Document deployment in change log | Record what changed, batch_ids, row counts | 1 hr |

**Exit Criteria:** Production data matches staging. Reporter Connected Mode operational.
Change log documented. Rollback scripts tested and ready.

---

## 3. Execution Timeline [REVISED]

| Week | Phase | Key Deliverables | Hours | Dependencies |
|------|-------|-----------------|-------|-------------|
| Week 1 | Phase 0: Backup + Staging | Production snapshot, staging DB, rollback scripts, change mgmt process | 9 hrs | Cloudflare API access |
| Weeks 1-2 | Phase 1: Control Catalog (parallel) | 1,189 NIST controls, FedRAMP/CMMC/171 frameworks, security_controls deprecated | 25 hrs | NIST OSCAL JSON |
| Weeks 1-2 | Phase 1.5: Frontend Updates (parallel) | sspMapper control sync, ctrlData reconciliation, narrative UI, dynamic counts | 24 hrs | None (this repo) |
| Weeks 3-4 | Phase 2: Implementations | 650 draft narratives, per-control status assessment, 100% ISSO review + signoff | 64 hrs | Phases 1 + 1.5 complete, system owner availability |
| Weeks 4-5 | Phase 3: Real Data | Actual assets, actual scan results, actual POA&Ms | 27 hrs | Real scan data available |
| Week 5-6 | Phase 4: Production Promotion | CCB approval, production deployment, smoke test | 14 hrs | Phases 1-3 validated on staging |

**Total Estimated Effort: 163 hours across 5-6 weeks**

Breakdown:
- Engineering (scripting, frontend, validation): ~100 hrs
- ISSO/System Owner review: ~40 hrs
- Change management & approvals: ~10 hrs
- Scanning & inventory collection: ~13 hrs

---

## 4. Technical Approach

*(Section 4.1 and 4.2 unchanged from v1.0)*

### 4.3 [NEW] Frontend Data Flow for Control Implementations

```
Backend D1                    sspMapper.ts                  Controls.tsx (S15)
+-----------------------+     +---------------------+      +------------------+
| control_implementations| --> | loadSSPFromBackend() | --> | ctrlData (flat)   |
| - control_id          |     | GET /api/v1/ssp/     |     | { "AC-1": {       |
| - status              |     |   {id}/control-      |     |   status: "impl", |
| - narrative           |     |   implementations    |     |   implementation: |
| - responsibility      |     +---------------------+     |   "narrative..."  |
+-----------------------+           |                      | } }               |
                                    v                      +------------------+
                              oscalExport.ts                        |
                              +---------------------+               |
                              | buildControlImpl()  | <-------------+
                              | ctrlData[id].impl   |
                              | ctrlData[id].status  |
                              +---------------------+
```

### 4.4 [REVISED] Production Seeding Safety

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Seeding target | Staging D1 first, promote to production after validation | Never seed untested data into production |
| Traceability | `batch_id` column on all seeded rows | Enables targeted rollback without affecting pre-existing data |
| Backup | D1 snapshot before every bulk operation | Point-in-time recovery if seeding goes wrong |
| Validation gate | ISSO signoff required before staging-to-production promotion | Human accountability for data quality |

---

## 5. Risk Register [REVISED]

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| D1 batch insert rate limiting | Medium | Medium | Batch in groups of 50; retry with exponential backoff |
| AI-generated narratives contain generic/hallucinated content | High | Critical | 100% ISSO review (P2-T6); no production push without signoff |
| OSCAL baseline JSON format changes between NIST releases | Low | High | Pin to OSCAL catalog v5.1.1; validate checksums |
| Forge Reporter API contract differs from seeded data | Medium | High | Phase 1.5 adds sspMapper sync; test on staging |
| ctrlData format mismatch between Controls.tsx and oscalExport.ts | Confirmed | Critical | Phase 1.5-T1 reconciles format before Phase 2 |
| Existing 585 control definitions have incorrect baseline data | Low | Medium | Phase 1 includes validation step (P1-T9) |
| No staging environment for validation | Resolved | N/A | Phase 0 creates staging D1 |
| Seeding corrupts existing production data | Medium | Critical | Phase 0 backup + batch_id traceability + staging-first approach |
| Real scan data not available for Phase 3 | Medium | High | Phase 3 prerequisites documented; schedule scans early |
| System profiles don't match actual architecture | Medium | Critical | System owner signs off on profiles before narrative generation |

---

## 6. Success Metrics [REVISED]

*(Same as v1.0 with these additions)*

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| *(all v1.0 metrics retained)* | | | |
| ISSO narrative signoff | 0 | 650 (100%) | Tracking sheet signoff count |
| Reporter S15 renders narratives | No | Yes | Manual verification in Connected Mode |
| OSCAL export includes narratives | No | Yes | Ajv validation of exported SSP |
| Staging validation complete | N/A | Yes | Full 23-section walkthrough on staging |
| Production backup exists | No | Yes | D1 snapshot verifiable |
| Rollback scripts tested | No | Yes | Tested on staging with batch_id DELETE |

---

## 7. Change Management Process [NEW]

### Production Data Changes

1. **Propose:** Engineering documents proposed changes (task IDs, row counts, affected tables)
2. **Validate on staging:** All changes executed and validated on staging D1 first
3. **ISSO review:** ISSO reviews data quality (especially narratives) and signs off
4. **CCB approval:** Change Control Board approves production deployment
5. **Backup:** Production D1 snapshot taken immediately before deployment
6. **Execute:** Seeding scripts run against production with `batch_id` tagging
7. **Verify:** Smoke test Reporter Connected Mode against production
8. **Document:** Change log entry with batch_id, timestamp, row counts, approver

### Rollback Procedure

If production seeding produces incorrect results:
```sql
-- Rollback all rows from a specific seeding batch
DELETE FROM control_definitions WHERE batch_id = 'seed-v2-20260310';
DELETE FROM control_implementations WHERE batch_id = 'seed-v2-20260310';
DELETE FROM assets WHERE batch_id = 'seed-v2-20260310';
DELETE FROM vulnerability_findings WHERE batch_id = 'seed-v2-20260310';
DELETE FROM poams WHERE batch_id = 'seed-v2-20260310';
```

If rollback is insufficient, restore from the pre-deployment D1 snapshot.

---

## 8. Immediate Next Actions [REVISED]

| Priority | Action | Owner | Due |
|----------|--------|-------|-----|
| P0 | Approve this revised plan | Stan | Day 1 |
| P0 | Execute Phase 0: production backup + staging setup | Engineering | Day 1-2 |
| P0 | Begin Phase 1: download NIST OSCAL catalog | Engineering | Day 2 |
| P0 | Begin Phase 1.5: ctrlData format reconciliation (P1.5-T1) | Engineering | Day 2 |
| P1 | Resolve security_controls vs control_definitions (P1-T10) | Engineering | Day 3 |
| P1 | Complete Phase 1.5: sspMapper sync + narrative UI | Engineering | Day 5-7 |
| P1 | System owner verifies system profiles for narrative generation | System Owner | Day 7 |
| P1 | Begin Phase 2: narrative generation | Engineering | Day 8 |
| P2 | Schedule vulnerability scans for Phase 3 (if not already run) | Security Ops | Day 7 |
| P2 | ISSO reviews all 650 narratives (P2-T6) | ISSO | Days 10-14 |
| P3 | Phase 3: import real scan/inventory data | Engineering | Day 15-18 |
| P3 | Phase 4: CCB approval + production promotion | CCB | Day 20 |

---

## Appendix: Differences from v1.0

| Section | v1.0 | v2.0 (this document) |
|---------|------|----------------------|
| Phases | 3 phases, 72 hrs | 5 phases, 163 hrs |
| Phase 0 | None | Production backup + staging |
| Phase 1.5 | None | Frontend changes to Forge Reporter |
| Phase 2 status approach | Target distribution curve (60/20/12/3/5%) | Per-control ISSO assessment |
| Phase 2 QA | 50-control spot-check (15%) | 100% ISSO review and signoff |
| Phase 3 data source | Synthetic/realistic data | Actual production data only |
| Phase 4 | None | Change management + production promotion |
| Rollback procedures | None | batch_id-based DELETE + D1 snapshot restore |
| Change management | None | Documented CCB process |
| "Demo" language | Throughout | Removed — all language reflects production |
| Frontend gaps | Not identified | 5 tasks documented (P1.5-T1 through T5) |
| ctrlData mismatch | Not identified | Documented and remediated in P1.5-T1 |

---

*This plan is designed for production deployment. Phase 1 (NIST catalog) can begin immediately
as it uses authoritative reference data. All other phases require staging validation before
production execution. No data enters production without ISSO signoff and CCB approval.*
