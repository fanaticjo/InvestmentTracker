# Implementation Plan: Investment Tracker (Verify & Align Existing Implementation)

## Overview

This spec reverse-engineers the **existing** Investment & Expense Tracker. The tasks below do **not** build new product features. Instead, they:

1. Stand up a JavaScript test harness (Vitest + fast-check + React Testing Library) for the PWA (`pwa/src/`) and for the pure logic of the Apps Script backend (`01_Main.gs`–`08_WebAppAPI.gs`).
2. Turn each of the 10 correctness properties in `design.md` into property-based tests, plus the unit/example and smoke tests described in the Testing Strategy.
3. Verify that the existing code satisfies each requirement and correctness property, and fix any misalignment found in the source.

Because the `.gs` files depend on Google globals (`SpreadsheetApp`, `CONFIG`, `UrlFetchApp`) that cannot be imported, each backend verification task extracts the relevant **pure logic** into a small ESM module under `pwa/test/logic/` that mirrors the `.gs` source exactly (Sheets I/O passed in as plain row arrays). The mirror must stay faithful to the source; when a test reveals the source violates a requirement, fix the source `.gs`/`.jsx` and keep the mirror in sync. All tests live under the existing `pwa/` npm project.

## Tasks

- [ ] 1. Set up the JavaScript test harness
  - [ ] 1.1 Install and configure the test runner in `pwa/`
    - Add dev dependencies to `pwa/package.json`: `vitest`, `@vitest/coverage-v8`, `fast-check`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`
    - Add `"test": "vitest --run"` and `"test:watch": "vitest"` scripts
    - Add a `test` block to `pwa/vite.config.js` (or a `vitest.config.js`) with `environment: 'jsdom'`, `globals: true`, and `setupFiles: './test/setup.js'`
    - Create `pwa/test/setup.js` importing `@testing-library/jest-dom` and providing shared mocks (e.g. `localStorage`, `navigator.onLine`, `fetch`)
    - _Requirements: 8.4, 11.1_
  - [ ] 1.2 Create the test folder structure and Apps Script logic-mirror scaffold
    - Create `pwa/test/logic/` (backend pure-logic mirrors), `pwa/test/unit/`, and `pwa/test/smoke/`
    - Add `pwa/test/logic/README.md` documenting that modules in this folder must mirror the `.gs` source exactly and are the verification surface for backend properties
    - Add a shared `pwa/test/logic/sheetRows.js` helper for building mock Sheets row arrays used by backend tests
    - _Requirements: 11.1_

- [ ] 2. Verify authentication and authorization logic
  - [ ] 2.1 Extract and verify email normalization + allowlist decision (implementation exists in `08_WebAppAPI.gs` and `components/Auth.jsx` — verification pending)
    - Create `pwa/test/logic/auth.js` mirroring `verifyAuth`'s `normalizeEmail` and allowlist membership check from `08_WebAppAPI.gs` (lowercase; strip dots from `gmail.com` local part)
    - Compare against the client-side allowlist normalization in `components/Auth.jsx`; confirm both use the same rule, and fix any divergence in the source
    - _Requirements: 10.2, 10.3_
  - [ ]* 2.2 Write property test for email normalization and allowlist decision
    - **Property 1: Email normalization and allowlist decision are dot- and case-insensitive**
    - **Validates: Requirements 10.2, 10.3**
    - Assert authorization is decided on the normalized email and that normalization is idempotent
  - [ ] 2.3 Verify the client-side allowlist gate in `Auth.jsx` (implementation exists in `components/Auth.jsx` — verification pending)
    - Confirm `Auth.jsx` performs the allowlist check on the signed-in email before login succeeds and stores `auth_token`/`auth_user`; fix if the gate is missing or bypassable
    - _Requirements: 10.2_
  - [ ]* 2.4 Write unit test for unauthorized-session clearing
    - In `pwa/test/unit/`, mock an `apiGet` response of `{ error: 'Unauthorized' }` and assert `api.js` clears `auth_token`/`auth_user` and triggers reload
    - _Requirements: 10.4, 12.2_

- [ ] 3. Verify API read filtering and summary aggregation
  - [ ] 3.1 Extract and verify recent-expense read filtering (implementation exists in `08_WebAppAPI.gs` — verification pending)
    - Create `pwa/test/logic/recentExpenses.js` mirroring `getRecentExpenses(days)` from `08_WebAppAPI.gs` (cutoff = now − days; include rows on/after cutoff; `count` equals returned length)
    - Verify behavior matches the requirement; fix the source if the cutoff or count is wrong
    - _Requirements: 11.1_
  - [ ]* 3.2 Write property test for recent-expense reads
    - **Property 2: Recent-expense reads include exactly the in-window records**
    - **Validates: Requirements 11.1**
  - [ ] 3.3 Extract and verify daily summary aggregation (implementation exists in `08_WebAppAPI.gs` — verification pending)
    - Create `pwa/test/logic/dailySummary.js` mirroring `getDailySummary` from `08_WebAppAPI.gs` (todayTotal, monthTotal, per-category totals)
    - Verify aggregation matches the requirement; fix the source if totals are inconsistent
    - _Requirements: 4.4, 11.2_
  - [ ]* 3.4 Write property test for summary aggregation consistency
    - **Property 3: Summary aggregation is internally consistent**
    - **Validates: Requirements 4.4, 11.2**
    - Assert sum of `categoryTotals` equals `monthTotal`, `monthTotal` equals current-month sum, and `todayTotal` equals today's sum
  - [ ]* 3.5 Write unit tests for summary edge cases
    - Cover empty sheet, single-row month, and rows spanning month/year boundaries
    - _Requirements: 11.2_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Verify budget and duplicate-detection utilities
  - [ ] 5.1 Extract and verify budget threshold classification (implementation exists in `06_Utilities.gs` — verification pending)
    - Create `pwa/test/logic/budget.js` mirroring `checkBudget`'s classification from `06_Utilities.gs` (OK < 80%; Warning 80–100%; Over Budget > 100%) and its alert-list construction
    - Verify the boundary behavior matches Requirements 5.2–5.5; fix the source thresholds if they diverge
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  - [ ]* 5.2 Write property test for budget status classification
    - **Property 4: Budget status classification partitions spend correctly**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
    - Assert alert list contains a category iff its status is Warning or Over Budget
  - [ ] 5.3 Extract and verify duplicate-expense detection (implementation exists in `06_Utilities.gs` — verification pending)
    - Create `pwa/test/logic/duplicates.js` mirroring `highlightDuplicateExpenses` keying from `06_Utilities.gs` (same date + category + amount)
    - Verify a record is flagged iff another record shares the key; fix the source key if it diverges
    - _Requirements: 7.1_
  - [ ]* 5.4 Write property test for duplicate detection
    - **Property 5: Duplicate detection flags exactly colliding records**
    - **Validates: Requirements 7.1**
  - [ ]* 5.5 Write unit test for CSV export content
    - Assert `exportMonthlyData` produces the header row and only current-month rows in CSV form
    - _Requirements: 7.2_

- [ ] 6. Verify client-side form normalization and validation
  - [ ] 6.1 Verify stock symbol uppercasing (implementation exists in `components/AddStock.jsx` and `api.js` — verification pending)
    - Confirm `components/AddStock.jsx` uppercases the symbol on input and `addStockAPI` persists `symbol.toUpperCase()`; fix if either path skips uppercasing
    - _Requirements: 3.2_
  - [ ]* 6.2 Write property test for symbol normalization
    - **Property 6: Stock symbol normalization is uppercasing and idempotent**
    - **Validates: Requirements 3.2**
  - [ ] 6.3 Verify SIP date restriction (1–28) (implementation exists in `components/AddStock.jsx` — verification pending)
    - Confirm the SIP form in `components/AddStock.jsx` accepts the SIP date iff it is within 1–28; fix the input constraint if it diverges
    - _Requirements: 2.2_
  - [ ]* 6.4 Write property test for SIP-date validation
    - **Property 7: SIP date validation accepts exactly 1 through 28**
    - **Validates: Requirements 2.2**
  - [ ] 6.5 Verify expense submit-enable and date defaulting (implementation exists in `components/AddExpense.jsx` — verification pending)
    - Confirm `components/AddExpense.jsx` disables submit while amount is empty or no category is selected, and defaults the date to today when none is supplied; fix if either behavior diverges
    - _Requirements: 1.2, 1.6_
  - [ ]* 6.6 Write property test for expense submit-enable
    - **Property 8: Expense submit is enabled iff amount and category are present**
    - **Validates: Requirements 1.6**
  - [ ]* 6.7 Write unit tests for remaining client behaviors
    - Cover date defaulting to today, Stock/SIP form toggling, Dashboard profit-green/loss-red coloring, and active-tab highlighting
    - _Requirements: 1.2, 9.1, 9.3, 9.5_

- [ ] 7. Verify offline queue and sync
  - [ ] 7.1 Verify offline-queue write path (implementation exists in `api.js` and `App.jsx` — verification pending)
    - Confirm `api.js` `queueOfflineExpense`/`getOfflineQueue` append with a `timestamp`, preserve order, return `[]` on corrupt JSON, and that `App.jsx` derives the badge count from the queue length
    - _Requirements: 12.1, 13.1, 13.2_
  - [ ]* 7.2 Write property test for offline-queue round-trip
    - **Property 9: Offline queue round-trip preserves submitted expenses**
    - **Validates: Requirements 12.1, 13.1, 13.2**
  - [ ] 7.3 Verify bulk sync clears the queue (implementation exists in `api.js` `syncOfflineQueue` — verification pending)
    - Confirm `syncOfflineQueue` sends all queued expenses in one `addMultipleExpenses` request, reports `synced` equal to queue length, clears the queue on success, and leaves it unchanged on failure
    - _Requirements: 13.3_
  - [ ]* 7.4 Write property test for successful sync invariant
    - **Property 10: Successful sync sends every queued expense once and empties the queue**
    - **Validates: Requirements 13.3**
  - [ ]* 7.5 Write unit tests for invalid-response and timeout handling
    - Assert a non-JSON response raises `Invalid response from server` and that a timed-out request surfaces a retry option
    - _Requirements: 12.3, 12.4_

- [ ] 8. Verify static configuration and PWA smoke tests
  - [ ]* 8.1 Write smoke test for reference-data lists
    - Assert `config.js` `CATEGORIES` (13), `PAYMENT_MODES` (6), and `SECTORS` (12) match the requirement-specified values
    - _Requirements: 1.3, 1.4, 3.3, 11.4_
  - [ ]* 8.2 Write smoke test for manifest and service-worker config
    - Assert `vite.config.js` PWA config declares name/short name/icons (192, 512)/standalone/portrait/theme #1a73e8/background #ffffff/scope+start `/InvestmentTracker/`, `registerType: 'autoUpdate'`, and network-first API caching with 24-hour expiry
    - _Requirements: 8.2, 8.3, 8.5, 13.5_
  - [ ]* 8.3 Write smoke test for workbook structure and menu registration
    - Extract `CONFIG` sheet names and assert the five tabs and the "Finance Tracker" menu entries defined in `01_Main.gs` match the requirements
    - _Requirements: 6.1, 6.6_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **Reverse-engineering status:** This spec documents already-built code. All product features are implemented across the backend (`01_Main.gs`–`08_WebAppAPI.gs`) and the PWA frontend (`pwa/src/`). The remaining work is standing up the test harness, writing the property/unit/smoke tests, and confirming/fixing alignment between the source and the requirements. No task is marked fully complete because the test harness does not yet exist and no verification or tests have been run — the inline "implementation exists" annotations only note that the underlying product code is present, not that verification has been done.
- Tasks marked with `*` are optional test tasks and can be skipped for a faster pass, but they are the primary deliverable of this verification spec — skipping them removes the property/unit coverage.
- Non-code behavior (live `GOOGLEFINANCE` prices, spreadsheet formula evaluation, service-worker runtime caching, mobile UI rendering, and end-to-end auth against Google `tokeninfo`) is covered by the Testing Strategy as integration/manual checks and is intentionally **not** turned into property tests.
- Each backend property test runs against a pure-logic mirror module with Sheets I/O mocked; keep each mirror faithful to its `.gs` source.
- Property tests use a minimum of 100 iterations and tag each property as `Feature: investment-tracker, Property {number}: {property_text}`.
- When a test reveals the source violates a requirement, fix the source (`.gs`/`.jsx`) rather than weakening the test.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.3", "5.1", "6.5", "7.1"] },
    { "id": 3, "tasks": ["2.2", "2.4", "3.1", "5.3", "6.1", "7.3"] },
    { "id": 4, "tasks": ["3.2", "3.3", "5.2", "5.4", "6.3", "7.2", "7.4"] },
    { "id": 5, "tasks": ["3.4", "3.5", "5.5", "6.2", "6.4", "6.6", "6.7", "7.5", "8.1", "8.2", "8.3"] }
  ]
}
```
