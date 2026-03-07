# Nexus Justice v3.1 — Complete SaaS Platform

AI-powered Legal SaaS for Indian Advocates — Progressive Web App

## 🏗 Architecture

```
nexus-saas/
├── backend/           # Express.js + MongoDB API server
│   ├── server.js      # Main server with all routes
│   └── package.json
├── frontend/          # React PWA
│   ├── src/
│   │   ├── App.jsx                        # Root router
│   │   ├── api.js                         # Axios client
│   │   └── portals/
│   │       ├── AuthPortal.jsx             # Sign In / Sign Up / Forgot
│   │       ├── AdvocatePortal.jsx         # Full advocate dashboard
│   │       ├── AgencyHQPortal.jsx         # Admin/agency dashboard
│   │       └── AffiliatePortal.jsx        # Affiliate dashboard
│   ├── public/
│   │   ├── manifest.json                  # PWA manifest
│   │   └── sw.js                          # Service Worker
│   └── index.html
├── Dockerfile                             # Multi-stage build
├── railway.toml                           # Railway config
└── .env.example                           # Environment variables template
```

## 🔗 Portal Connections

| Feature | How it works |
|---|---|
| Advocate Signup → Agency HQ | New signups are stored in MongoDB and instantly appear in Agency HQ Pending tab |
| Agency HQ Approval | Approving sends a notification to the advocate's account |
| Affiliate Link in Notifications | Advocate gets their unique referral link in Notifications page |
| "Check your commission here" | Notification type `affiliate_portal` links to Affiliate Portal |
| Affiliate Link Social Share | Advocate Portal → Notifications shows copy link + social share buttons |
| Broadcasts → Advocates | Agency HQ can send announcements that appear as notifications in Advocate Portal |

## 🤖 AI Stack

| Service | Role | Fallback |
|---|---|---|
| **DeepSeek API** | Primary AI orchestration, legal consultations | → Gemini |
| **Gemini 2.0 Flash Lite** | Legacy/fallback AI | Always available |
| **Sarvam AI** | Local language TTS + Translation (8 Indian languages) | → Gemini translation |
| **Serper.dev** | Web search for legal research | Gemini answers without search |

## 🚀 Deploy to Railway

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Nexus Justice v3.1 SaaS"
git remote add origin https://github.com/yourusername/nexus-justice.git
git push -u origin main
```

### Step 2: Railway Setup
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repository
3. Add **MongoDB plugin** from Railway marketplace
4. Set environment variables (see below)
5. Railway auto-detects Dockerfile and deploys

### Step 3: Environment Variables in Railway
```
MONGO_URI          = (Railway auto-injects as MONGODB_URL)
JWT_SECRET         = your_secret_key_here
DEEPSEEK_API_KEY   = sk-your-deepseek-key
GEMINI_API_KEY     = your-gemini-key
SARVAM_API_KEY     = your-sarvam-key
SERPER_API_KEY     = your-serper-key
APP_URL            = https://your-app.railway.app
NODE_ENV           = production
```

> **Note:** Railway MongoDB plugin auto-sets `MONGODB_URL`. The backend checks both `MONGO_URI` and `MONGODB_URL`.

## 👥 Demo Credentials (auto-seeded)

| Portal | Email | Password |
|---|---|---|
| Advocate | sanjay@nexusjustice.in | demo1234 |
| Agency HQ | admin@nexusjustice.in | admin1234 |
| Affiliate | sarah@lawpartner.in | demo1234 |

## 📱 PWA Installation
- Visit the deployed URL on mobile
- Browser will show "Add to Home Screen" prompt
- App works offline (cached shell)

## 🔧 Local Development
```bash
# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install

# Start backend (port 3001)
cd ../backend && node server.js

# Start frontend (port 5173)
cd ../frontend && npm run dev
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Advocate registration |
| POST | /api/auth/login | Login (all roles) |
| GET | /api/advocate/notifications | Get notifications |
| GET | /api/agency/advocates | List all advocates |
| GET | /api/agency/pending | Pending approvals |
| POST | /api/agency/approve/:id | Approve advocate |
| POST | /api/agency/broadcast | Send broadcast |
| GET | /api/affiliate/dashboard | Affiliate stats |
| POST | /api/ai/consult | AI legal consultation |
| POST | /api/ai/draft | AI document drafting |
| POST | /api/ai/search | Web search + AI summary |
| POST | /api/sarvam/translate | Translate to Indian languages |
| POST | /api/sarvam/tts | Text-to-speech |
| GET | /api/health | Health check |
