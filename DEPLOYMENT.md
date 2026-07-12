# Deployment Guide

Complete guide to clone, configure, and deploy the Investment Tracker for your own use.

## Prerequisites

- A Google account (Gmail)
- [Node.js](https://nodejs.org/) (v18+)
- A GitHub account
- A Google Sheet (create a new blank one)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/fanaticjo/InvestmentTracker.git
cd InvestmentTracker
```

---

## Step 2: Set Up Google Sheets (Apps Script)

### 2.1 Create the Tracker Sheets

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete the default `Code.gs` content
4. Create separate `.gs` files for each script (use the `+` button), or paste all into one file:
   - `01_Main.gs`
   - `02_DailyExpenses.gs`
   - `03_SIPTracker.gs`
   - `04_StockPortfolio.gs`
   - `05_MonthlySummary.gs`
   - `06_Utilities.gs`
   - `07_DailyDashboard.gs`
   - `08_WebAppAPI.gs`
5. Run `setupAll` from the function dropdown
6. Grant permissions when prompted

### 2.2 Configure Authentication

In `08_WebAppAPI.gs`, update the `ALLOWED_EMAILS` array with your Gmail:

```javascript
const ALLOWED_EMAILS = [
  'your-email@gmail.com'
];
```

### 2.3 Deploy as Web App

1. Click **Deploy → New Deployment**
2. Type: **Web App**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy**
6. Copy the **Web App URL** (you'll need it in Step 4)

---

## Step 3: Create Google OAuth Credentials

### 3.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Investment Tracker")

### 3.2 Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - App name: `Investment Tracker`
   - User support email: your email
   - Developer contact email: your email
4. Click **Save and Continue** through all steps
5. Publish the app (move from Testing to Production)

### 3.3 Create OAuth Client ID

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth Client ID**
3. Application type: **Web application**
4. Name: `Investment Tracker PWA`
5. **Authorized JavaScript origins** — add:
   ```
   https://YOUR_GITHUB_USERNAME.github.io
   https://localhost:5173
   ```
6. Leave **Authorized redirect URIs** blank
7. Click **Create**
8. Copy the **Client ID** (looks like `123456789.apps.googleusercontent.com`)

---

## Step 4: Configure the PWA

```bash
cd pwa
npm install
```

Create a `.env` file in the `pwa/` directory:

```env
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Replace:
- `YOUR_DEPLOYMENT_ID` — the Web App URL from Step 2.3
- `YOUR_CLIENT_ID` — the OAuth Client ID from Step 3.3

---

## Step 5: Test Locally

```bash
npm run dev
```

Open `https://localhost:5173/InvestmentTracker/` in your browser. Accept the self-signed certificate warning. Sign in with your Google account and test adding an expense.

---

## Step 6: Deploy to GitHub Pages

### 6.1 Push source code

```bash
cd ..
git add -A
git commit -m "feat: Initial setup"
git push origin main
```

### 6.2 Deploy the PWA

```bash
cd pwa
npm run deploy
```

This builds the app and pushes to the `gh-pages` branch.

### 6.3 Enable GitHub Pages

1. Go to your repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / root
4. Click **Save**

Wait ~1 minute. Your app is live at:

```
https://YOUR_GITHUB_USERNAME.github.io/InvestmentTracker/
```

---

## Step 7: Install on iPhone

1. Open the deployed URL in **Safari** on your iPhone
2. Sign in with your Google account
3. Tap the **Share** button (square with arrow)
4. Tap **"Add to Home Screen"**
5. Tap **Add**

The app is now installed on your home screen like a native app.

---

## Updating the App

When you make changes:

1. Edit the source code
2. Test locally with `npm run dev`
3. Deploy: `npm run deploy`
4. The live site updates automatically

For Apps Script changes:
1. Update the code in the Apps Script editor
2. Go to **Deploy → Manage deployments → Edit → New version → Deploy**

---

## Project Structure

```
InvestmentTracker/
├── 01_Main.gs              # Config, menu, setup orchestrator
├── 02_DailyExpenses.gs     # Expense sheet + quick-add dialog
├── 03_SIPTracker.gs        # SIP tracking with auto-calculations
├── 04_StockPortfolio.gs    # Stocks with GOOGLEFINANCE live prices
├── 05_MonthlySummary.gs    # Dashboard: income, net worth, breakdown
├── 06_Utilities.gs         # onEdit triggers, budget alerts, export
├── 07_DailyDashboard.gs    # Daily expense dashboard with budgets
├── 08_WebAppAPI.gs         # API endpoints for the PWA
├── README.md               # Project overview
├── DEPLOYMENT.md           # This file
├── .gitignore
└── pwa/                    # React PWA
    ├── src/
    │   ├── App.jsx         # Main app with tab navigation
    │   ├── App.css         # Mobile-first styles
    │   ├── api.js          # API service with offline queue
    │   ├── config.js       # Configuration (reads from .env)
    │   ├── main.jsx        # Entry point
    │   └── components/
    │       ├── Auth.jsx    # Google Sign-In
    │       ├── AddExpense.jsx
    │       ├── AddStock.jsx
    │       └── Dashboard.jsx
    ├── public/
    ├── .env                # Secrets (gitignored)
    ├── .env.example        # Template for .env
    ├── package.json
    └── vite.config.js
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 on API call | Redeploy Apps Script with "Who has access: Anyone" |
| CORS error locally | Use `npm run dev` (HTTPS) instead of `npm run preview` (HTTP) |
| Google Sign-In not showing | Check `VITE_GOOGLE_CLIENT_ID` in `.env` and authorized origins |
| Data not appearing in sheet | Check sheet tab names match exactly (case-sensitive) |
| Entries after TOTAL row | Redeploy Apps Script with latest `08_WebAppAPI.gs` |
| `gh-pages` branch error | Run `rm -rf node_modules/.cache/gh-pages` then `npm run deploy` |

---

## Security

- **Google Sign-In** ensures only authorized emails can access the API
- **Apps Script** verifies the Google ID token server-side
- **`.env` file** is gitignored — secrets never go to GitHub
- **Client ID** is safe to be public (designed for frontend use)
- **API URL** is protected by auth — unusable without a valid Google token

To add more authorized users, update `ALLOWED_EMAILS` in `08_WebAppAPI.gs` and redeploy.
