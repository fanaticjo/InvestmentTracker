# Specifications Index

## Documents

| Document | Description |
|----------|-------------|
| [requirements.md](requirements.md) | Product overview, problem statement, goals, target user |
| [functional-requirements.md](functional-requirements.md) | Feature specs: expenses, SIPs, stocks, dashboards, budgets |
| [non-functional-requirements.md](non-functional-requirements.md) | Performance, security, privacy, architecture, data schema |
| [pwa-requirements.md](pwa-requirements.md) | Mobile app UI/UX, offline support, API integration |

## Quick Reference

### Tech Stack
- **Frontend:** React 19 + Vite + PWA
- **Backend:** Google Apps Script (serverless)
- **Database:** Google Sheets
- **Auth:** Google Sign-In (OAuth 2.0)
- **Hosting:** GitHub Pages (free)
- **Cost:** ₹0

### Key Constraints
- No backend server
- No third-party data storage
- Single-user per deployment
- Google Sheets cell limit: 10M cells
- Google ID tokens expire every 1 hour
- Apps Script execution: 90 min/day (free tier)
- PWA install only via Safari on iOS

### Future Considerations
- Multi-user support (per-user sheets)
- Recurring expense auto-entry
- EMI tracker
- Investment goal tracking
- Charts and visualizations
- Push notifications for budget alerts
- CSV/PDF export
- Dark mode
