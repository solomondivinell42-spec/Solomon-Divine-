# Solomon Prediction

A light modern sports prediction web app starter.

## Features
- Free daily football, basketball and tennis predictions
- VIP plans:
  - VIP 2 Odds — rollover ₦5,000 — 7 days
  - VIP 5 Odds — rollover ₦3,000 — 4 days
  - 1.50 Odds — rollover ₦5,000 — 7 days
- Payment submission form with payer name, plan, reference and screenshot
- Private admin dashboard for approving/rejecting VIP requests
- Admin can publish predictions from the dashboard
- SQLite database
- Screenshot uploads stored locally in `uploads/`

## Run locally
1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Run:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:3000`
5. Admin dashboard: `http://localhost:3000/admin/login.html`

## Important
The starter uses manual admin approval. A screenshot alone does not automatically verify a payment. For production, connect a verified payment gateway/webhook and store secrets only in environment variables.
