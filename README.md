# BizBooks - Small Business Accounting App

A complete offline-capable accounting application for small businesses, packaged as an Android APK.

## Features

- **Cash Book** — Track all cash inflows and outflows with running balance
- **Accounts Receivable** — Manage customers, invoices, and payments with aging reports
- **Accounts Payable** — Track vendors, bills, and payments with aging reports
- **Inventory Management** — Multi-store stock tracking with transfers and adjustments
- **Dashboard** — Real-time financial overview with profit/loss and low stock alerts
- **Print Reports** — Generate professional PDF-ready reports for invoices, statements, and more
- **Offline Mode** — Works completely without internet; data stored locally on device
- **Cloud Sync** — Optional Firebase integration for multi-device sync when online

## Quick Start (APK)

### Option 1: Build with Android Studio (Recommended)

1. **Install Prerequisites:**
   - [Node.js v18+](https://nodejs.org/)
   - [Android Studio](https://developer.android.com/studio)
   - Android SDK (installed via Android Studio)

2. **Build the APK:**
   ```bash
   # Run the build script
   ./build.sh

   # Or manually:
   npm install
   npx cap add android
   npx cap sync android
   npx cap open android
   ```

3. **In Android Studio:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Use Pre-built Web Version

Simply open `index.html` in any modern web browser. The app works fully in offline mode.

## File Structure

```
bizbooks/
├── index.html          # Main app (works in browser)
├── www/                # Web assets for Capacitor
│   └── index.html
├── capacitor.config.json
├── package.json
├── build.sh            # Automated build script
└── BUILD_INSTRUCTIONS.md
```

## Data Storage

- **Online:** Firebase Firestore (when internet is available)
- **Offline:** localStorage (automatic fallback, data persists on device)

## Screenshots

The app includes:
- Dashboard with financial KPIs
- Cash Book with transaction history
- Customer & Vendor management
- Invoice & Bill creation
- Stock transfer between stores
- Aging analysis reports

## License

MIT License — Free for personal and commercial use.
