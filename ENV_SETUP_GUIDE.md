# 🚀 Environment Setup Guide

## Quick Start (5 minutes)

### Step 1: Copy the template
```bash
cp .env.example .env
```

### Step 2: Fill in REQUIRED values

Open `.env` and update these **REQUIRED** values:

```env
# 1. Database (use local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aubrigo

# 2. JWT Secret (generate with command below)
JWT_SECRET=<paste-generated-value>

# 3. Stripe Keys (get from Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# 4. Email SMTP (for password reset, notifications)
EMAIL_FROM=noreply@aubrigo.pt
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@aubrigo.pt
```

---

## 📝 How to Get Each Value

### 1. JWT_SECRET - Generate Random String

Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it in `.env`:
```env
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c03f28f55e8f9a8f5f167f44f4964e6c9
```

---

### 2. Stripe Keys

**Go to:** https://dashboard.stripe.com/test/apikeys

You'll see TWO keys - copy BOTH:

```
┌─────────────────────────────────────────────┐
│ Publishable key                              │
│ pk_test_51Abc123...              [Copy]      │  👈 COPY THIS
├─────────────────────────────────────────────┤
│ Secret key                                   │
│ sk_test_51Xyz789...              [Reveal]    │  👈 AND THIS
└─────────────────────────────────────────────┘
```

Paste both in `.env`:
```env
STRIPE_SECRET_KEY=sk_test_51Xyz789...
STRIPE_PUBLISHABLE_KEY=pk_test_51Abc123...
```

---

### 3. Email SMTP (Gmail Example)

**For Gmail:**
1. Go to: https://myaccount.google.com/apppasswords
2. Create an "App Password" for "Mail"
3. Copy the 16-character password

**Update `.env`:**
```env
EMAIL_FROM=noreply@aubrigo.pt
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # 16-char app password
ADMIN_EMAIL=admin@aubrigo.pt
```

**Other SMTP providers:**
- **Outlook:** `smtp-mail.outlook.com` (port 587)
- **SendGrid:** `smtp.sendgrid.net` (port 587)

---

### 4. Database URL

**Local development:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aubrigo
```

**Production (Supabase example):**
1. Go to your Supabase project
2. Settings → Database → Connection string → URI
3. Copy and paste

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

---

## ✅ Verify Setup

### Test Backend:
```bash
cd backend
npm install
npm run start:dev
```

You should see:
```
[Nest] Application successfully started on port 3002
```

### Test Frontend:
```bash
cd frontend
npm install
npm start
```

Visit: http://localhost:4200

---

## 🔧 Optional Configuration

These have defaults and can be skipped for local development:

### Webhooks (for production only)
```env
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**How to set up:**
1. Deploy your backend
2. Go to: https://dashboard.stripe.com/webhooks
3. Add endpoint: `https://your-api.com/api/stripe-connect/webhook`
4. Select events: `account.*`, `charge.*`, `payout.*`
5. Copy "Signing secret"

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX=300             # 300 requests
AUTH_RATE_LIMIT_MAX=10         # 10 auth attempts
```

---

## 🚨 Common Issues

### Issue: "Cannot connect to database"
**Solution:** Make sure PostgreSQL is running:
```bash
# Windows
pg_ctl status

# Mac/Linux
sudo service postgresql status
```

### Issue: "JWT_SECRET not configured"
**Solution:** Generate a new secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue: "Stripe key invalid"
**Solution:**
- Make sure you copied the FULL key (starts with `sk_test_` or `pk_test_`)
- Check you're in TEST mode on Stripe dashboard (toggle top-right)

### Issue: "Email sending fails"
**Solution:**
- Gmail: Enable 2FA and create App Password
- Check SMTP credentials are correct
- Port 587 should work for most providers

---

## 📁 Project Structure

```
aubrigo/
├── .env                    👈 Your secrets (NEVER commit!)
├── .env.example            👈 Template (safe to commit)
├── backend/
│   └── src/
│       └── app.module.ts   (loads from root .env)
├── frontend/
│   └── src/
│       └── environments/
│           └── environment.ts  (hardcode STRIPE_PUBLISHABLE_KEY here)
```

---

## 🔒 Security Checklist

- ✅ `.env` is in `.gitignore` (already done)
- ✅ Never commit `.env` file to Git
- ✅ Use different JWT_SECRET in production
- ✅ Use Stripe LIVE keys only in production
- ✅ Keep SECRET keys in backend only

---

## 🎯 Minimum to Start Coding

**Just need these 5 values:**
1. `DATABASE_URL` - local PostgreSQL
2. `JWT_SECRET` - generate random string
3. `STRIPE_SECRET_KEY` - from Stripe dashboard
4. `STRIPE_PUBLISHABLE_KEY` - from Stripe dashboard
5. Email settings (for password reset to work)

Everything else has defaults! 🎉

---

**Need help?** Check the `.env.example` file for detailed comments on each variable.
