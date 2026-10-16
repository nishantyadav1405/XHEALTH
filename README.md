# XHEALTH — CareBridge AI

A patient-controlled health record management prototype with a dark-themed UI.

## Structure

- **`index.html`** — Self-contained frontend (HTML/CSS/JS single-page app)
- **`backend/`** — Express + Supabase API server (TypeScript)

## Deploy Frontend on Vercel

The frontend is a static `index.html` that deploys directly to Vercel with zero configuration.

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Fill in your Supabase credentials
npm run dev
```

## Demo

All data shown in the UI is illustrative/synthetic. This project does not provide medical advice.
