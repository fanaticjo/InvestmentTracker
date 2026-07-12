# PWA Requirements

## PWA-1: Mobile App Experience

### PWA-1.1: Installation
- Installable on iPhone via Safari "Add to Home Screen"
- Installable on Android via Chrome "Install App" prompt
- Custom app icon (192x192, 512x512)
- App name: "Investment Tracker", short name: "Tracker"
- Standalone display mode (no browser chrome)
- Portrait orientation

### PWA-1.2: Service Worker
- Precaches all app shell files (HTML, CSS, JS, icons)
- Runtime caching for API responses (NetworkFirst, 24hr expiry)
- Auto-update on new deployments (registerType: autoUpdate)

### PWA-1.3: Manifest
- theme_color: #1a73e8
- background_color: #ffffff
- scope: /InvestmentTracker/
- start_url: /InvestmentTracker/

---

## PWA-2: UI/UX Requirements

### PWA-2.1: Navigation
- Bottom tab bar with 3 tabs: Expense, Stock/SIP, Dashboard
- Active tab highlighted
- Fixed position (always visible)
- Safe area padding for iPhone notch/home indicator

### PWA-2.2: Add Expense Screen
- Large amount input (centered, 24px font)
- Quick amount preset buttons (₹50 - ₹2000)
- Category selection via chip/pill grid
- Payment mode selection via chip/pill grid
- Date picker (defaults to today)
- Description text input
- Notes text input (optional)
- Submit button showing amount ("Add ₹500 Expense")
- Submit disabled until amount + category selected

### PWA-2.3: Stock/SIP Screen
- Tab switch between Stock and SIP forms
- Stock form: Symbol, Name, Sector chips, Qty, Price, Date, Notes
- SIP form: Fund Name, AMC, Monthly Amount, SIP Date, Start Date, Total Months
- Auto-capitalize stock symbol input

### PWA-2.4: Dashboard Screen
- Sub-tabs: Today, Stocks, SIPs
- Today: spending cards, category breakdown list, today's entries
- Stocks: portfolio value, P&L with arrow indicator, holdings list
- SIPs: portfolio value, monthly outflow, active SIPs list
- Refresh button to reload data
- Color coding: green=profit, red=loss

### PWA-2.5: Auth Screen
- Centered login card
- App title and description
- Google Sign-In button (rendered by GSI library)
- Error message if Client ID not configured
- User bar after login showing avatar, name, logout button

### PWA-2.6: Feedback
- Toast notifications (success=green, error=red)
- Slide-down animation
- Auto-dismiss after 3 seconds
- Offline badge showing queued count
- "Offline" indicator when no network
- Loading states for dashboard

### PWA-2.7: Design System
- Font: -apple-system, BlinkMacSystemFont (system fonts)
- Primary color: #1a73e8
- Success: #34a853
- Danger: #ea4335
- Warning: #fbbc04
- Border radius: 8-12px for cards, 20px for chips
- iOS safe area handling (env(safe-area-inset-*))
- 100dvh for full viewport height

---

## PWA-3: API Integration

### PWA-3.1: Write Operations
- addExpense: POST with GET fallback (CORS handling)
- addStock: POST with GET fallback
- addSIP: POST with GET fallback
- addMultipleExpenses: bulk sync for offline queue

### PWA-3.2: Read Operations
- getSummary: today's total, month total, category breakdown, today's entries
- getStocks: all holdings with current values
- getSIPs: all SIPs with returns
- getCategories: category and payment mode lists

### PWA-3.3: Error Handling
- Network failure → queue expense offline
- Unauthorized response → clear session, redirect to login
- Invalid response → show error toast
- Timeout → show retry option

---

## PWA-4: Offline Capabilities

### PWA-4.1: Offline Queue
- Expenses saved to localStorage when offline
- Queue key: 'offlineExpenseQueue'
- Each entry timestamped
- Badge shows queue count in header
- Auto-sync on 'online' event
- Bulk send via addMultipleExpenses action

### PWA-4.2: Cached Data
- App shell always available offline
- Last API responses cached for 24hrs (Workbox runtimeCaching)
- Dashboard shows cached data when offline
