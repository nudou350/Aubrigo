# 🔄 Environment Sync - How It Works

## Overview

Both **backend** and **frontend** now use the **same root `.env` file** as the single source of truth.

---

## 📁 File Structure

```
aubrigo/
├── .env                           👈 SINGLE SOURCE OF TRUTH
├── .env.example                   👈 Template
│
├── backend/
│   └── src/
│       └── app.module.ts         👈 Loads from ../../.env
│
└── frontend/
    ├── scripts/
    │   └── sync-env.js           👈 Syncs .env → environment.ts
    └── src/
        └── environments/
            ├── environment.ts     👈 AUTO-GENERATED (don't edit!)
            └── environment.prod.ts 👈 AUTO-GENERATED (don't edit!)
```

---

## 🔧 How It Works

### Backend (NestJS)
- **Loads directly** from root `.env` via ConfigModule
- Path: `envFilePath: "../../.env"`
- Uses ALL environment variables

### Frontend (Angular)
- **Cannot load .env directly** (Angular limitation)
- **Auto-sync script** reads root `.env` and generates `environment.ts`
- Only needs: `STRIPE_PUBLISHABLE_KEY`
- Runs automatically before `npm start` and `npm run build`

---

## 📝 Workflow

### When You Update `.env`:

**Option 1: Auto-sync (Recommended)**
```bash
# Just start your app - sync happens automatically!
cd frontend
npm start
# ✅ Sync runs automatically via prestart hook
```

**Option 2: Manual sync**
```bash
cd frontend
npm run sync-env
# ✅ Syncs STRIPE_PUBLISHABLE_KEY to environment files
```

---

## 🚀 Usage

### Starting Development:

**Backend:**
```bash
cd backend
npm run start:dev
# ✅ Reads from root .env automatically
```

**Frontend:**
```bash
cd frontend
npm start
# ✅ Syncs .env first, then starts dev server
```

### Building for Production:

```bash
cd frontend
npm run build:prod
# ✅ Syncs .env first, then builds
```

---

## ⚙️ What Gets Synced?

### Backend Uses (from root `.env`):
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `STRIPE_SECRET_KEY` ← Backend only!
- `STRIPE_CONNECT_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `EMAIL_*` (all email settings)
- `RATE_LIMIT_*` (all rate limit settings)

### Frontend Uses (synced from root `.env`):
- `STRIPE_PUBLISHABLE_KEY` ← Safe to expose publicly!

**Why different keys?**
- **Backend:** Uses `STRIPE_SECRET_KEY` (sk_test_...) - MUST stay secret!
- **Frontend:** Uses `STRIPE_PUBLISHABLE_KEY` (pk_test_...) - Safe to expose in browser

---

## 🔍 Verifying Setup

### Check Backend Configuration:
```bash
cd backend
grep -A 2 "ConfigModule.forRoot" src/app.module.ts
```

Expected output:
```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: "../../.env", // Loads from root folder
```

### Check Frontend Sync:
```bash
cd frontend
npm run sync-env
```

Expected output:
```
✅ Updated: src\environments\environment.ts
✅ Updated: src\environments\environment.prod.ts
```

### Check Generated Files:
```bash
cat frontend/src/environments/environment.ts
```

Should contain:
```typescript
export const environment = {
  production: false,
  apiUrl: "/api",
  stripePublicKey: "pk_test_...", // From root .env
};
```

---

## ⚠️ Important Notes

### DO NOT Edit These Files Manually:
- ❌ `frontend/src/environments/environment.ts`
- ❌ `frontend/src/environments/environment.prod.ts`

**Why?** They are **auto-generated** by `sync-env.js` and will be overwritten!

### DO Edit This File:
- ✅ `.env` (root folder)

This is your **single source of truth**!

### DO Commit:
- ✅ `.env.example` (template)
- ✅ `frontend/scripts/sync-env.js` (sync script)
- ✅ `ENV_SYNC_README.md` (this file)

### DO NOT Commit:
- ❌ `.env` (contains secrets!)
- ✅ `environment.ts` files **CAN** be committed (only contains public Stripe key)

---

## 🐛 Troubleshooting

### Error: "STRIPE_PUBLISHABLE_KEY not found in .env"

**Solution:** Add it to root `.env`:
```env
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

Then run:
```bash
cd frontend
npm run sync-env
```

### Error: ".env file not found"

**Solution:** Create `.env` from template:
```bash
cp .env.example .env
```

Then fill in your values.

### Frontend not using updated key?

**Solution:** Run sync manually:
```bash
cd frontend
npm run sync-env
npm start
```

### Backend not loading variables?

**Check path:**
```bash
cd backend
grep "envFilePath" src/app.module.ts
```

Should be: `envFilePath: "../../.env"`

---

## 📊 Environment Variables Summary

| Variable | Backend | Frontend | Required |
|----------|---------|----------|----------|
| `DATABASE_URL` | ✅ | ❌ | ✅ Yes |
| `JWT_SECRET` | ✅ | ❌ | ✅ Yes |
| `STRIPE_SECRET_KEY` | ✅ | ❌ | ✅ Yes |
| `STRIPE_PUBLISHABLE_KEY` | ❌ | ✅ | ✅ Yes |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | ✅ | ❌ | Production only |
| `STRIPE_WEBHOOK_SECRET` | ✅ | ❌ | Production only |
| `EMAIL_*` | ✅ | ❌ | ✅ Yes |
| `FRONTEND_URL` | ✅ | ❌ | ✅ Yes |
| `NODE_ENV` | ✅ | ❌ | Optional (has default) |
| `PORT` | ✅ | ❌ | Optional (default: 3002) |

---

## ✅ Quick Checklist

**Initial Setup:**
- [ ] Created `.env` from `.env.example`
- [ ] Added `STRIPE_SECRET_KEY` to `.env`
- [ ] Added `STRIPE_PUBLISHABLE_KEY` to `.env`
- [ ] Added database URL to `.env`
- [ ] Added email settings to `.env`
- [ ] Generated JWT secret and added to `.env`

**Verify:**
- [ ] Backend loads from `../../.env`
- [ ] Frontend sync script works
- [ ] Both apps start successfully

**You're done!** 🎉

---

**Need help?** See `ENV_SETUP_GUIDE.md` for detailed setup instructions.
