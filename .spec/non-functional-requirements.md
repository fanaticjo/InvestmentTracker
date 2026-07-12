# Non-Functional Requirements

## NFR-1: Performance
- Add expense in under 5 seconds (tap to confirmation)
- Dashboard load time under 3 seconds on 4G
- App shell loads instantly from service worker cache
- GOOGLEFINANCE stock prices update within Google Sheets' refresh cycle (~15 min delay)

## NFR-2: Availability
- App shell available 100% (cached via service worker)
- API availability dependent on Google Apps Script uptime (99.9%)
- Offline expense entry always available via localStorage queue

## NFR-3: Security
- Google Sign-In (OAuth 2.0) for authentication
- Server-side token verification via Google's tokeninfo endpoint
- Email-based authorization (allowlist in Apps Script)
- No passwords stored anywhere
- API URL acts as additional secret layer
- Frontend blocks unauthorized emails before API call
- Tokens expire after 1 hour, app handles re-authentication

## NFR-4: Privacy
- All financial data stored in user's own Google Sheet
- No third-party analytics or tracking
- No data leaves user's Google account
- No server-side data storage
- Open source — auditable code

## NFR-5: Scalability
- Single user per deployment (by design)
- Allowed emails configurable for family/shared access
- Google Sheets limit: 10 million cells per sheet
- Apps Script quota: 90 min/day execution time (free tier)

## NFR-6: Compatibility
- iOS Safari (primary — PWA install)
- Android Chrome (PWA install)
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Minimum: iOS 14+, Android 8+

## NFR-7: Offline Support
- App UI loads without internet (service worker)
- Expenses queued in localStorage when offline
- Auto-sync when connectivity returns
- Offline queue visible to user (badge count)

## NFR-8: Hosting & Cost
- GitHub Pages for PWA hosting (free)
- Google Apps Script for API (free)
- Google Sheets for database (free)
- Google Cloud OAuth (free tier)
- Total operational cost: ₹0

---

# Technical Requirements

## TR-1: Architecture

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  React PWA       │────→│  Google Apps Script  │────→│ Google Sheet │
│  (GitHub Pages)  │     │  (Web App API)       │     │ (Database)   │
│                  │     │                      │     │              │
│  - Vite          │     │  - doGet / doPost    │     │  - 5 tabs    │
│  - React 19      │     │  - Token verification│     │  - Formulas  │
│  - PWA plugin    │     │  - CRUD operations   │     │  - GFINANCE  │
│  - Service Worker│     │  - Email allowlist   │     │              │
└──────────────────┘     └─────────────────────┘     └──────────────┘
        │                          │
        │                    Google OAuth
        │                          │
        └────── Google Sign-In ────┘
```

## TR-2: Frontend Stack
- React 19.x
- Vite 6.x (build tool)
- vite-plugin-pwa (service worker, manifest)
- @vitejs/plugin-basic-ssl (local HTTPS dev)
- No UI framework (custom CSS, mobile-first)
- No state management library (useState sufficient)

## TR-3: Backend Stack
- Google Apps Script (serverless)
- Google Sheets API (via SpreadsheetApp)
- ContentService for JSON responses
- UrlFetchApp for token verification

## TR-4: Authentication Flow
```
1. User opens app
2. Check localStorage for saved token
3. If token exists and not expired → use it
4. If no token or expired → show Google Sign-In
5. User signs in → get ID token (JWT)
6. Frontend validates email against allowlist
7. Token sent with every API request
8. Apps Script verifies token with Google
9. Apps Script checks email against ALLOWED_EMAILS
10. If authorized → process request
11. If unauthorized → return error, app clears session
```

## TR-5: Offline Sync Flow
```
1. User adds expense
2. fetch() to Apps Script
3. If network fails → save to localStorage queue
4. Show "saved offline" toast
5. Listen for 'online' event
6. When online → read queue → POST all via addMultipleExpenses
7. Clear queue on success
```

## TR-6: Deployment
- Source code: GitHub (main branch)
- PWA: GitHub Pages (gh-pages branch, auto via `npm run deploy`)
- API: Google Apps Script (manual deploy as Web App)
- Environment: .env file (gitignored) for secrets

## TR-7: Data Schema

### Daily Expenses
| Column | Type | Source |
|--------|------|--------|
| Date | Date | User input |
| Category | String (enum) | Dropdown |
| Description | String | User input |
| Payment Mode | String (enum) | Dropdown |
| Amount | Number | User input |
| Notes | String | User input |
| Month-Year | String | Formula (auto) |

### SIP Tracker
| Column | Type | Source |
|--------|------|--------|
| Fund Name | String | User input |
| AMC | String | User input |
| Folio No. | String | User input |
| SIP Date | Number (1-28) | User input |
| Monthly Amount | Number | User input |
| Start Date | String | User input |
| Total Months | Number | User input |
| Units Accumulated | Number | User input |
| Current NAV | Number | User input |
| Current Value | Number | Formula |
| Total Invested | Number | Formula |
| Returns | Number | Formula |
| Return % | Number | Formula |
| Status | String (enum) | Dropdown |

### Stock Portfolio
| Column | Type | Source |
|--------|------|--------|
| Stock Name | String | User input |
| Symbol (NSE) | String | User input |
| Sector | String (enum) | User input |
| Buy Date | Date | User input |
| Qty | Number | User input |
| Avg Buy Price | Number | User input |
| Invested | Number | Formula |
| CMP | Number | GOOGLEFINANCE (auto) |
| Current Value | Number | Formula |
| P&L | Number | Formula |
| P&L % | Number | Formula |
| Day Change % | Number | GOOGLEFINANCE (auto) |
| Status | String (enum) | Dropdown |
| Notes | String | User input |
