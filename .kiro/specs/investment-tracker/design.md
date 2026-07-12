# Design Document

## Overview

The Investment & Expense Tracker is a three-tier personal-finance system that runs entirely inside the user's own Google account at zero operational cost. This document reverse-engineers the **existing** implementation and describes its architecture as currently built; it does not propose new architecture or features.

The three tiers are:

1. **PWA_Client** — a React 19 + Vite Progressive Web App (`pwa/src/`) hosted on GitHub Pages, installable to a phone home screen and usable offline.
2. **API_Service** — a Google Apps Script web application (`08_WebAppAPI.gs`) exposing `doGet` / `doPost` endpoints that verify a Google ID token, enforce an email allowlist, and read/write the workbook.
3. **Sheets_Database** — a Google Sheets workbook (`01_Main.gs`–`07_DailyDashboard.gs`) holding five tabs, with formulas and `GOOGLEFINANCE` doing the numeric heavy lifting.

Authentication uses Google Sign-In (OAuth 2.0). The client checks the signed-in email against a client-side allowlist before making any request; the server independently verifies the ID token with Google and checks its own allowlist. Expenses entered while offline are held in a `localStorage` queue and bulk-synced when connectivity returns. A `vite-plugin-pwa` service worker precaches the app shell and caches API responses network-first.

This design documents behavior across all 13 requirements. Because much of the system's computation lives in spreadsheet formulas, `GOOGLEFINANCE`, and the Google Apps Script UI, the correctness-testable surface is concentrated in the pure JavaScript logic of the API layer and the offline/auth client logic.

## Architecture

### System Context

```
┌──────────────────────┐        ┌───────────────────────┐        ┌────────────────────┐
│   PWA_Client          │        │   API_Service          │        │  Sheets_Database    │
│   (GitHub Pages)      │        │  (Apps Script Web App) │        │  (Google Sheets)    │
│                       │        │                        │        │                     │
│  React 19 / Vite      │─HTTPS─▶│  doGet / doPost        │─Apps──▶│  Daily Expenses     │
│  Service Worker (SW)  │  JSON  │  verifyAuth (tokeninfo)│ Script │  SIP Tracker        │
│  localStorage queue   │◀───────│  read/write functions  │  API   │  Stock Portfolio    │
│  Google Sign-In (GSI) │        │  ALLOWED_EMAILS list   │        │  Monthly Summary    │
└──────────┬────────────┘        └───────────┬────────────┘        │  Daily Dashboard    │
           │                                  │                     │  + GOOGLEFINANCE    │
           │                                  │                     └────────────────────┘
           │                          Google OAuth (tokeninfo)
           │                                  │
           └────────── Google Sign-In (ID token / JWT) ────────────┘
```

- **Transport:** The PWA sends JSON to a single Apps Script deployment URL (`API_URL` in `config.js`, overridable via `VITE_API_URL`). Writes prefer `POST`; on any transport failure the client retries via `GET` with the payload encoded as query parameters (Apps Script `GET` avoids a CORS preflight).
- **Data flow:** All persistence is Google Sheets. The Apps Script reads/writes cells directly via `SpreadsheetApp`; derived numeric columns (Invested, Current Value, P&L, Returns, Month-Year) are **spreadsheet formulas**, and live prices come from `GOOGLEFINANCE`. The API never stores state of its own.
- **Auth:** Google Sign-In issues an ID token (JWT) to the client. The client stores it in `localStorage` and attaches it to every request. The server verifies it against Google's `tokeninfo` endpoint on every request.

### Hosting & Cost Model

Per NFR-8: GitHub Pages (PWA), Apps Script (API), Google Sheets (DB), and Google Cloud OAuth are all free-tier; total operational cost is ₹0. Scalability is intentionally single-user-per-deployment (NFR-5), with the allowlist enabling optional family sharing.

### Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Front end | React 19, Vite 6 | No UI framework; custom mobile-first CSS. No state library; `useState` only. |
| PWA | `vite-plugin-pwa` (Workbox) | `registerType: 'autoUpdate'`; manifest + SW generated at build. |
| Dev HTTPS | `@vitejs/plugin-basic-ssl` | Required for GSI + SW on localhost. |
| Auth (client) | Google Identity Services (GSI) | Renders Sign-In button, returns ID token. |
| API | Google Apps Script | `doGet`/`doPost`, `ContentService` JSON, `UrlFetchApp` for token verification. |
| Data | Google Sheets | `SpreadsheetApp`, in-cell formulas, `GOOGLEFINANCE`. |

## Components and Interfaces

### PWA_Client (`pwa/src/`)

**`main.jsx`** — React entry point; mounts `<App/>`.

**`App.jsx`** — App shell and root state. Owns:
- `activeTab` (`expense` | `stock` | `dashboard`) driving the fixed bottom tab bar (Req 9.1).
- `offlineCount` badge and `navigator.onLine` offline indicator (Req 13.2).
- `toast` notifications (success/error, 3-second auto-dismiss via `setTimeout`) (Req 9.6).
- An `online` event listener that calls `syncOfflineQueue()` on reconnect (Req 13.3).
- Wraps content in `<Auth>` so no tab renders until authenticated.

**`components/Auth.jsx`** — Renders the Google Sign-In card, receives the ID token, performs the **client-side allowlist check** on the account email before login succeeds (Req 10.2), stores `auth_token` / `auth_user` in `localStorage`, and shows the user bar (avatar, name, logout). Handles missing Client ID with an error message.

**`components/AddExpense.jsx`** — Expense form: large amount input, quick-amount presets (₹50–₹2000, Req 1.5), category chip grid (13 categories, Req 1.3), payment-mode chips (6 modes, Req 1.4), date picker defaulting to today (Req 1.2), description/notes. Submit is disabled while amount is empty or no category is selected (Req 1.6). Calls `addExpense()`.

**`components/AddStock.jsx`** — Toggles between the Stock form and the SIP form (Req 9.3). Stock form auto-uppercases the symbol (Req 3.2), sector chips (12 sectors, Req 3.3). SIP form restricts SIP date to 1–28 (Req 2.2). Calls `addStock()` / `addSIP()`.

**`components/Dashboard.jsx`** — Today / Stocks / SIPs sub-views with a refresh control (Req 9.4). Reads via `getSummary()`, `getStocks()`, `getSIPs()`; renders profit green / loss red (Req 9.5). Shows cached data when offline (Req 13.4).

**`config.js`** — `API_URL` (env-overridable) and the canonical `CATEGORIES`, `PAYMENT_MODES`, `SECTORS` lists.

**`api.js`** — API service layer (see interface below).

#### `api.js` Interface

```javascript
// Auth
setAuthToken(token)                 // sets in-memory token used by requests

// Writes (POST, GET fallback)
addExpense(expense) -> Promise<result>
addStock(stock)     -> Promise<result>
addSIP(sip)         -> Promise<result>

// Reads (GET)
getSummary()            -> Promise<{ todayTotal, monthTotal, categoryTotals, todayExpenses, date }>
getExpenses(days = 7)   -> Promise<{ expenses, count }>
getStocks()             -> Promise<{ stocks }>
getSIPs()               -> Promise<{ sips }>

// Offline queue (localStorage key 'offlineExpenseQueue')
queueOfflineExpense(expense)   // append with timestamp
getOfflineQueue() -> Array     // safe JSON parse, [] on error
syncOfflineQueue() -> Promise<{ synced, error? }>  // bulk POST, clear on success
```

Behavior:
- `apiPost` short-circuits when `!navigator.onLine`: `addExpense` payloads are queued and a synthetic `{ success, offline: true }` is returned; other actions throw `No internet connection` (Req 12.1, 13.1).
- On a `POST` transport error, `apiPost` retries via `GET` with the payload in query params; if that also fails, `addExpense` is queued as a last resort.
- `apiGet` clears the session and reloads when the server responds `{ error: 'Unauthorized' }` (Req 12.2, 10.4); non-JSON responses raise `Invalid response from server` (Req 12.3).

### API_Service (`08_WebAppAPI.gs`)

`doGet(e)` and `doPost(e)` share the same shape: extract `action` + `token`, call `verifyAuth(token)`, and dispatch. `doGet` doubles as the write path when a `data` query param is present (the client's CORS-avoiding `GET` fallback, Req 11.1). All responses are JSON via `ContentService`.

| Action | Type | Handler | Requirement |
|--------|------|---------|-------------|
| `addExpense` | write | `addExpenseAPI` | 1.1 |
| `addStock` | write | `addStockAPI` | 3.1 |
| `addSIP` | write | `addSIPAPI` | 2.1 |
| `addMultipleExpenses` | write | `addMultipleExpensesAPI` | 11.5, 13.3 |
| `getExpenses` | read | `getRecentExpenses(days)` | 11.x |
| `getSummary` | read | `getDailySummary` | 11.2 |
| `getStocks` | read | `getStockPortfolio` | 11.3 |
| `getSIPs` | read | `getSIPData` | 11.3 |
| `getCategories` | read | inline (`CONFIG`) | 11.4 |

**`verifyAuth(token)`** (auth kept high-level per NFR-3): fetches Google's `tokeninfo` endpoint to cryptographically verify the ID token, extracts `email`, **normalizes** it (lowercase; for `gmail.com`, strips dots from the local part), and checks membership against the normalized `ALLOWED_EMAILS`. Returns `{ authorized: true, email }` or `{ authorized: false, error }` (Req 10.3, 10.4). The dual allowlist (client-side in `Auth.jsx`, server-side here) means the client blocks unauthorized emails before calling, and the server is the authoritative gate.

**Write handlers** locate the first empty data row (inserting a row before the `TOTAL` / `PORTFOLIO TOTAL` summary row when the sheet is full), write user-supplied cells, and set **formula** cells for derived values so the spreadsheet computes Invested, Current Value, P&L, Returns, and Month-Year.

**Read handlers** scan the used range, skip the header and summary rows, and project each row into a plain object. `getRecentExpenses` filters to rows on/after a `days`-based cutoff; `getDailySummary` aggregates today's total, month total, and per-category totals in a single pass.

### Sheets_Database (`01_Main.gs`–`07_DailyDashboard.gs`)

- **`01_Main.gs`** — `CONFIG` (currency, sheet names, colors, categories, payment modes), the custom **💰 Finance Tracker** menu (`onOpen`), and `setupAll` which builds/reset the five tabs (Req 6.1, 6.6).
- **`02`–`05`** — Per-tab setup: headers, frozen header rows (Req 6.4), data-validation dropdowns (Req 6.2), conditional formatting green/red (Req 6.3), and the 12-month + net-worth Monthly Summary (Req 4).
- **`06_Utilities.gs`** — `onEdit` auto-fills formulas when key cells change (Req 6.5); `checkBudget` (threshold classification, Req 5), `highlightDuplicateExpenses` (Req 7.1), `exportMonthlyData` (CSV dialog, Req 7.2), `getMonthlyExpenseReport` (Req 7.3), `setupTriggers`.
- **`07_DailyDashboard.gs`** — In-sheet daily dashboard refresh.

### Authentication Flow (high-level)

```
1. App loads → check localStorage for auth_token
2. No/expired token → render Google Sign-In (GSI)
3. User signs in → GSI returns ID token (JWT)
4. Client normalizes + checks email against client allowlist (Req 10.2)
5. Token stored; attached to every request
6. Server verifyAuth → tokeninfo verification + server allowlist (Req 10.3)
7. Authorized → process; Unauthorized → error → client clears session (Req 10.4)
8. Expired token → client prompts re-authentication (Req 10.5)
```

## Data Models

The full column schema is defined in `.spec/non-functional-requirements.md` (TR-7). Summary of the persisted records and their transport shapes:

### Expense_Record (Daily Expenses tab)
`Date, Category, Description, Payment Mode, Amount, Notes, Month-Year(formula)`. Read shape: `{ date, category, description, paymentMode, amount, notes }`.

### SIP_Record (SIP Tracker tab)
`Fund Name, AMC, Folio No., SIP Date(1–28), Monthly Amount, Start Date, Total Months, Units, Current NAV, Current Value(formula), Total Invested(formula), Returns(formula), Return %(formula), Status`. Read shape: `{ fundName, amc, monthlyAmount, currentValue, invested, returns, returnPct, status }`.

### Stock_Record (Stock Portfolio tab)
`Stock Name, Symbol(NSE), Sector, Buy Date, Qty, Avg Buy Price, Invested(formula), CMP(GOOGLEFINANCE), Current Value(formula), P&L(formula), P&L %(formula), Day Change %(GOOGLEFINANCE), Status, Notes`. Read shape: `{ name, symbol, sector, qty, avgPrice, invested, cmp, currentValue, pnl, pnlPct, status }`.

### Offline_Queue (localStorage)
Key `offlineExpenseQueue`; JSON array of expense payloads, each with an added `timestamp` (`Date.now()`). Bulk-synced via `addMultipleExpenses`.

### Reference Data
`CATEGORIES` (13), `PAYMENT_MODES` (6), `SECTORS` (12) — static lists in `config.js` / `CONFIG`.

## Error Handling

| Condition | Layer | Behavior | Requirement |
|-----------|-------|----------|-------------|
| Offline while adding expense | Client | Enqueue to Offline_Queue; return `{ offline: true }` toast | 12.1, 13.1 |
| POST transport error | Client | Retry via GET fallback; enqueue expense if that fails too | 11.1, 12.1 |
| Unauthorized response | Client | Clear `auth_token`/`auth_user`, reload to sign-in | 12.2, 10.4 |
| Invalid / non-JSON response | Client | Throw `Invalid response from server` → error toast | 12.3 |
| Timeout | Client | Present retry option | 12.4 |
| Missing/invalid token | Server | Return `{ error: 'Unauthorized', details }` | 10.3 |
| Handler exception | Server | Catch and return `{ error: message }` JSON | 12.3 |
| Corrupt queue JSON | Client | `getOfflineQueue` returns `[]` | 13.1 |

## Testing Strategy

The system spans pure JavaScript logic (API layer, offline queue, auth normalization, aggregation, budget/duplicate utilities) and non-code behavior (spreadsheet formulas, `GOOGLEFINANCE`, service-worker caching, Apps Script UI, mobile UI). Per the prework classification:

- **Property tests** target the pure-logic surface where behavior varies meaningfully with input and 100+ iterations reveal edge cases: email normalization/allowlist, expense read filtering, summary aggregation consistency, budget threshold classification, duplicate detection, symbol uppercasing, SIP-date and submit-enable validation, and the offline-queue round-trip / bulk-sync invariant. Sheets I/O is mocked so logic is tested independently of the spreadsheet.
- **Unit / example tests** cover concrete flows: date defaulting, unauthorized-session clearing, invalid-response toast, timeout retry, tab highlighting, form toggling, profit/loss coloring, CSV export content.
- **Smoke tests** verify static configuration once: category/payment/sector lists, manifest fields, `autoUpdate`, Workbox caching config, menu registration, tab structure.
- **Integration tests** (1–3 examples) verify Sheets writes/reads, formula population, `GOOGLEFINANCE`, and end-to-end auth against Google `tokeninfo`. These are **not** property-based, since behavior does not vary meaningfully with input and repeated iterations are costly and low-value.

**Property test configuration:** minimum 100 iterations per property; each property test references its design property using the tag format **Feature: investment-tracker, Property {number}: {property_text}**.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Email normalization and allowlist decision are dot- and case-insensitive

*For any* account email and any allowlist, the authorization decision (both client-side and server-side) SHALL be computed on the normalized email — lowercased, and for `gmail.com` addresses with dots removed from the local part — such that a user is authorized if and only if their normalized email matches a normalized allowlist entry, and normalization is idempotent (normalizing an already-normalized email yields the same value).

**Validates: Requirements 10.2, 10.3**

### Property 2: Recent-expense reads include exactly the in-window records

*For any* set of Expense_Records and any positive `days` window, `getRecentExpenses(days)` SHALL return exactly those records whose date is on or after the cutoff (now minus `days`), and its reported `count` SHALL equal the number of returned records.

**Validates: Requirements 11.1**

### Property 3: Summary aggregation is internally consistent

*For any* set of Expense_Records, the summary produced by `getDailySummary` SHALL satisfy: the sum of all `categoryTotals` values equals `monthTotal`; `monthTotal` equals the sum of amounts of records in the current month; and `todayTotal` equals the sum of amounts of records dated today.

**Validates: Requirements 4.4, 11.2**

### Property 4: Budget status classification partitions spend correctly

*For any* category spend and positive budget, the budget check SHALL classify the category as OK when spend is below 80% of budget, Warning when spend is at least 80% and at most 100% of budget, and Over Budget when spend exceeds 100% of budget; and the produced alert list SHALL contain a category if and only if its status is Warning or Over Budget.

**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 5: Duplicate detection flags exactly colliding records

*For any* set of Expense_Records, the duplicate-detection utility SHALL flag a record if and only if at least one other record shares the same date, category, and amount.

**Validates: Requirements 7.1**

### Property 6: Stock symbol normalization is uppercasing and idempotent

*For any* stock symbol string, the persisted symbol SHALL equal the uppercase form of the input, and applying the transformation again SHALL leave it unchanged.

**Validates: Requirements 3.2**

### Property 7: SIP date validation accepts exactly 1 through 28

*For any* integer SIP date value, the PWA_Client SHALL accept it if and only if it lies in the inclusive range 1 to 28.

**Validates: Requirements 2.2**

### Property 8: Expense submit is enabled iff amount and category are present

*For any* combination of amount input and category selection, the expense submit control SHALL be enabled if and only if the amount is non-empty and a category is selected.

**Validates: Requirements 1.6**

### Property 9: Offline queue round-trip preserves submitted expenses

*For any* sequence of expenses submitted while offline, reading the Offline_Queue back SHALL yield the same expenses in submission order (each carrying a timestamp), and the badge count SHALL equal the number of queued expenses.

**Validates: Requirements 12.1, 13.1, 13.2**

### Property 10: Successful sync sends every queued expense once and empties the queue

*For any* non-empty Offline_Queue, a successful `syncOfflineQueue` SHALL submit all queued Expense_Records in a single bulk request (reporting `synced` equal to the queue length) and SHALL leave the Offline_Queue empty; a failed sync SHALL leave the queue unchanged.

**Validates: Requirements 13.3**
