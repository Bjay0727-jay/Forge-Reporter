# Code Review: ForgeComply 360 Reporter

**Date:** 2026-02-16
**Scope:** Full codebase review — security, correctness, architecture, UX, accessibility, CI/CD

---

## Executive Summary

Forge-Reporter is a well-structured ~13,000-line React/TypeScript application for FISMA/FedRAMP SSP authoring with OSCAL 1.1.2 support. The codebase demonstrates solid architecture (offline-first design, modular sections, code-splitting) and uses a modern stack (React 19, Vite 7, Tailwind 4).

This review identifies **5 critical**, **18 high**, and numerous medium-severity findings across security, data integrity, type safety, accessibility, and CI/CD configuration. The most urgent issues involve synchronization race conditions, incomplete OSCAL type definitions, and missing input validation.

---

## Critical Findings

### C1. Prompt Injection in AI Service
**File:** `src/services/ai.ts:357-368`

User-provided `customInstructions` and `currentContent` are interpolated directly into AI prompts without sanitization. An attacker (or even accidental user input) can break out of the intended prompt structure.

**Recommendation:** Sanitize or escape user content before injection. Use structured message formats (system/user role separation) rather than string concatenation. Add input length limits.

---

### C2. Race Conditions in Sync — Data Loss Risk
**File:** `src/hooks/useSync.ts:146,172,204`

Multiple critical concurrency issues:
- **No lock mechanism (lines 146, 172):** If `saveToServer()` is called twice rapidly, both use the same `previousDataRef.current`, causing duplicate or missing updates.
- **`Promise.all` fails atomically (line 204):** If syncing 5 items and the 4th fails, items 1-3 are already persisted but 4-5 are lost — creating inconsistent state with no recovery.
- **Race in mode detection (lines 98-105):** `previousOnlineModeRef` is mutated during the render phase.

**Recommendation:**
- Add a mutex/lock around sync operations (e.g., a `syncInProgress` ref).
- Replace `Promise.all` with `Promise.allSettled` and report partial failures.
- Move ref mutations into `useEffect`, not the render body.

---

### C3. OSCAL Type Definitions Diverge from 1.1.2 Spec
**File:** `src/types/oscal.ts` (multiple locations)

Several type definitions don't match the NIST OSCAL 1.1.2 schema, which means generated documents may fail external validation:

| Line | Issue |
|------|-------|
| 144-147 | `SecurityImpactLevel` keys use `security-objective-*` instead of spec's `*-impact` |
| 127-130 | `InformationType` impact structure nested incorrectly |
| 218-230 | Component `type` is `string` — spec uses an enumerated set |
| 244-255 | `PortRange` transport limited to TCP/UDP; spec allows SCTP, DCCP, etc. |
| 257-273 | Uses removed `ImplementedComponent` — spec uses `component-uuid` directly |
| 325-328 | `ImplementationStatus` missing `satisfied` state added in 1.1.2 |
| 29-36 | Metadata missing `published` and `responsible-parties` (required fields) |

**Recommendation:** Audit `oscal.ts` against the official NIST OSCAL 1.1.2 JSON schema (already bundled at `src/schemas/oscal/oscal_ssp_schema.json`). Consider auto-generating types from the schema.

---

### C4. SSPData Allows Completely Empty Objects
**File:** `src/types/index.ts:5-169`

Every property on `SSPData` is optional. `const ssp: SSPData = {}` is valid at the type level, which undermines all downstream validation. Related issues:
- `ctrlData` (line 106) allows arbitrary nesting with no key validation.
- `Contact` type (line 233) has all fields optional — a contact with zero fields is valid.
- Mix of naming conventions (`sysName` vs `owningAgency` vs `rmf_prepare`).

**Recommendation:** Define a `RequiredSSPFields` subset for core fields (`sysName`, `conf`, `integ`, `avail`). Use discriminated unions or branded types for enums like impact levels.

---

### C5. Incomplete Sync Logic — Deletes Not Propagated
**File:** `src/services/sspMapper.ts:588-609`

The comment on line 593 states: *"For now, just add new items (full sync would need delete/update logic)"*. This means:
- Deleting info types in Reporter doesn't delete them on the backend.
- `.catch(() => { /* Ignore duplicates */ })` on lines 605-607 swallows **all** errors, including network failures.

**Recommendation:** Implement full CRUD sync or document the limitation prominently. At minimum, stop swallowing non-duplicate errors.

---

## High-Severity Findings

### H1. JWT Decoded Without Signature Verification
**File:** `src/services/api.ts:77-88`

`decodeToken()` base64-decodes the JWT payload without verifying the signature. While server-side validation presumably occurs on API calls, the client trusts unverified claims for UI state (e.g., expiry, user info).

**Recommendation:** Add a comment documenting that server-side verification is relied upon. Consider validating token structure more rigorously.

### H2. Token Exposed in URL Hash
**File:** `src/services/api.ts:220-231`

Auth tokens arrive via URL hash (`#token=JWT&ssp=ID&api=URL`). Although `replaceState` clears the hash, there is a window where the token is visible in browser history, analytics, and logging.

**Recommendation:** Document the security model. Consider using a short-lived exchange code pattern instead.

### H3. No Server-Side Token Validation on Connect
**File:** `src/hooks/useAuth.ts:167-176`

The `connect()` function validates token format locally but never verifies it with the server. A forged token with valid structure would be accepted until the first API call fails.

**Recommendation:** Make a lightweight validation call (e.g., `GET /me`) during `connect()`.

### H4. Token Expiry Checked Only Every 60 Seconds
**File:** `src/hooks/useAuth.ts:156`

`setInterval(checkExpiry, 60000)` means a token can expire mid-operation. Users may lose unsaved work when their next API call fails.

**Recommendation:** Check expiry before each API call, or reduce interval to 10-15 seconds. Add proactive "session expiring" warnings.

### H5. No File Size Validation on Import
**File:** `src/utils/oscalImport.ts:62`

`JSON.parse(content)` is called with no prior size check. A maliciously large file can exhaust browser memory.

**Recommendation:** Check `file.size` before reading (e.g., reject files > 10MB). Add a progress indicator for large files.

### H6. OSCAL Validator Disables Strict Mode
**File:** `src/utils/oscalValidator.ts:58`

`strict: false` on the Ajv instance means documents with arbitrary additional properties pass validation. This undermines schema compliance.

**Recommendation:** Enable strict mode or at minimum `additionalProperties: false` on key schema definitions.

### H7. No Field-Level Input Validation
**File:** `src/utils/validation.ts:100-133`

Validation only checks for empty/null values. Missing:
- Email format validation
- Enum validation (impact levels should be `low | moderate | high` only)
- String length limits
- Cross-field consistency (e.g., baseline must match impact level)
- Date format validation for RTO/RPO fields

**Recommendation:** Add format validators for each field type. Implement cross-field rules for NIST compliance.

### H8. Weak UUID Fallback
**File:** `src/utils/oscalExport.ts:40-50`

When `crypto.randomUUID()` is unavailable, the fallback uses `Math.random()`, which is not cryptographically secure. UUIDs appear in OSCAL documents as persistent identifiers.

**Recommendation:** Use `crypto.getRandomValues()` for the fallback, which has broader support than `randomUUID()` but is still cryptographically sound.

### H9. XSS via Unsanitized Error Display
**File:** `src/components/AIAssist.tsx:230`

`aiState.error` is rendered directly in the DOM. If the error originates from an API response containing HTML, it could execute as markup.

**Recommendation:** Use React's default escaping (ensure you're not using `dangerouslySetInnerHTML`) and sanitize error strings from external sources.

### H10. Missing RMF "Assess" and "Authorize" Sections
**File:** `src/config/sections.ts`

`RMF_STEPS` includes `'Assess'` and `'Authorize'`, but no section in `SECTIONS` is assigned to either step. Assessment findings and authorization decisions are core RMF requirements that cannot be documented.

**Recommendation:** Add sections for Assessment Report and Authorization Decision, or map them to existing sections.

### H11. `alert()` and `confirm()` for Critical Actions
**File:** `src/App.tsx:319,342,348`

Browser `alert()` is used for validation feedback and `confirm()` guards a destructive "clear all data" action. These are blocking, non-customizable, and inaccessible.

**Recommendation:** Replace with in-app modal dialogs that support keyboard navigation and screen readers.

### H12. Incomplete Error Propagation in `sspMapper.ts`
**File:** `src/services/sspMapper.ts:794-847`

Change detection uses `JSON.stringify()` for deep equality, which:
- Is expensive for large objects
- Breaks if array item order changes (semantically equal but different serialization)
- Cannot handle circular references

**Recommendation:** Use a purpose-built deep-equal library or structural comparison.

### H13. Form Labels Not Associated with Inputs
**File:** `src/components/FormComponents.tsx:107-120`

The `Lbl` component renders `<label>` without `htmlFor`. Screen readers cannot associate labels with their inputs — a WCAG 2.1 Level A violation.

**Recommendation:** Pass `htmlFor` to labels or use implicit association (wrap input inside label).

### H14. No Text Length Limits on Inputs
**File:** `src/components/FormComponents.tsx:171-227`

`TI` (text input) and `TA` (textarea) components have no `maxLength`. Users can paste arbitrarily large content, breaking layouts and inflating storage.

**Recommendation:** Add sensible `maxLength` props. For textareas used with AI generation, add character counters.

### H15. ESLint React Hooks Rules Disabled
**File:** `eslint.config.js:35-37`

Three React hooks rules are completely disabled:
- `react-hooks/set-state-in-effect`
- `react-hooks/refs`
- `react-hooks/immutability`

These mask real bugs (state updates in effects, refs during render, mutation bugs).

**Recommendation:** Re-enable these rules and fix violations. They catch legitimate issues.

### H16. CI Pipeline Missing Security Scanning
**File:** `.github/workflows/ci.yml`

No `npm audit`, dependency scanning, or SBOM generation. For a FISMA/FedRAMP compliance tool, this is particularly important (EO 14028 requires SBOM).

**Recommendation:** Add `npm audit --audit-level=high` to CI. Consider integrating Dependabot or Snyk. Add SBOM generation step.

### H17. Drag-and-Drop Zone Not Keyboard Accessible
**File:** `src/components/ImportModal.tsx:315`

The file drop zone uses `onClick` but isn't a `<button>`. It has no `role`, `tabindex`, or keyboard event handlers. Keyboard-only users cannot activate it.

**Recommendation:** Add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space.

### H18. AI Modal Not Keyboard Dismissible
**File:** `src/components/AIAssist.tsx:268-294`

The modal backdrop has `onClick={onDismiss}` but no `Escape` key handler. Keyboard-only users are trapped.

**Recommendation:** Add `onKeyDown` listener for Escape key on the modal or use a `<dialog>` element.

---

## Medium-Severity Findings

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| M1 | `api.ts` | 174 | URL validation uses only `startsWith('http')` — doesn't catch protocol-relative URLs |
| M2 | `api.ts` | 203-205 | Backend error messages used unsanitized in client errors |
| M3 | `ai.ts` | 392-396 | AI API failures silently fall back to offline generation without logging |
| M4 | `ai.ts` | 380-384 | System name, org name sent in plaintext to AI API — compliance-sensitive |
| M5 | `sspMapper.ts` | 248-254 | Array mapping doesn't validate required fields on each item |
| M6 | `sspMapper.ts` | 260-267 | `parseJSON()` returns `undefined` on error — silent data loss for RMF tracking |
| M7 | `useSync.ts` | 248 | Status only transitions from `synced` → `dirty`; `error` state is a dead end |
| M8 | `oscalExport.ts` | 226,377 | User data interpolated into OSCAL description strings without escaping |
| M9 | `oscalImport.ts` | 144-167 | Force-casts party data without validating structure |
| M10 | `oscalImport.ts` | 290-297 | No validation that impact levels are `low/moderate/high` |
| M11 | `pdfExport.ts` | 277-280 | No text length limits — very long input can create enormous PDFs |
| M12 | `ExportModal.tsx` | 120 | Modal width changes dynamically, causing layout shift |
| M13 | `ImportModal.tsx` | 47-50 | Previous import result persists when modal is reopened |
| M14 | `App.tsx` | 95-96 | Race condition: `skipDirtyRef` set before async operation completes |
| M15 | `vite.config.ts` | 35 | Chunk size warning at 600KB is above recommended threshold |
| M16 | `tsconfig.app.json` | — | Missing `forceConsistentCasingInFileNames` and `isolatedModules` |
| M17 | `test/setup.ts` | 35 | `randomUUID()` mock returns same value every call — hides uniqueness bugs |

---

## Recommendations Summary

### Immediate (pre-release blockers)
1. Fix sync race conditions (C2) — data loss risk
2. Add input validation beyond empty checks (H7) — compliance requirement
3. Correct OSCAL type definitions (C3) — documents fail external validation
4. Add file size limits on import (H5) — DoS vector

### Short-term
5. Implement sync locking and `Promise.allSettled` (C2)
6. Add `npm audit` and SBOM generation to CI (H16)
7. Re-enable ESLint hooks rules and fix violations (H15)
8. Associate form labels with inputs (H13, WCAG compliance)
9. Replace `alert()`/`confirm()` with accessible modals (H11)
10. Add Escape key handling to all modals (H18)

### Medium-term
11. Auto-generate OSCAL types from bundled JSON schema (C3)
12. Implement full CRUD sync for backend (C5)
13. Add cross-field validation rules (H7)
14. Add keyboard accessibility to drag-and-drop zones (H17)
15. Sanitize AI prompt inputs (C1)
16. Add proactive session expiry warnings (H4)

### Long-term / Architecture
17. Consider a state machine for sync status (idle → syncing → synced/error)
18. Add end-to-end tests for OSCAL export → import roundtrip
19. Add integration tests for connected mode auth flow
20. Implement structured logging for debugging sync and AI issues
