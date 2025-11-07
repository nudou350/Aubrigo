# Email Configuration Guide - Aubrigo

This guide explains how to configure the email system for Aubrigo, which uses **Gmail SMTP** with **Nodemailer**.

## Table of Contents

1. [Overview](#overview)
2. [Gmail SMTP Setup](#gmail-smtp-setup)
3. [Environment Variables](#environment-variables)
4. [Email Features](#email-features)
5. [Testing Email](#testing-email)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Aubrigo uses Gmail SMTP to send transactional emails for:

- **ONG Registration**: Admin notifications & welcome emails
- **ONG Approval/Rejection**: Status update emails
- **Password Reset**: Secure password reset links
- **Appointments**: Visitor and ONG notifications
- **Donations**: Receipt emails

---

## Gmail SMTP Setup

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Follow the steps to enable 2-Step Verification

### Step 2: Create App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **App Passwords**
   - If you don't see "App Passwords," make sure 2-Step Verification is enabled
3. Click **Select app** and choose **Mail**
4. Click **Select device** and choose **Other (Custom name)**
5. Enter "Aubrigo" as the custom name
6. Click **Generate**
7. **Copy the 16-character password** (you'll need this for the .env file)

⚠️ **Important**: This is NOT your regular Gmail password. You must use the App Password generated above.

### Step 3: Configure Environment Variables

Create a `.env` file in the `backend` folder (if it doesn't exist) and add:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com          # Your Gmail address
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx       # 16-char App Password from Step 2
EMAIL_FROM=noreply@petsos.com            # Sender email (can be different from EMAIL_USER)
ADMIN_EMAIL=admin@petsos.com             # Admin email to receive ONG registration notifications
```

**Example:**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=petsos.platform@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=noreply@petsos.com
ADMIN_EMAIL=admin@petsos.com
```

---

## Environment Variables

| Variable         | Description                                    | Example                 | Required |
| ---------------- | ---------------------------------------------- | ----------------------- | -------- |
| `EMAIL_HOST`     | SMTP server hostname                           | `smtp.gmail.com`        | Yes      |
| `EMAIL_PORT`     | SMTP port (587 for TLS, 465 for SSL)           | `587`                   | Yes      |
| `EMAIL_USER`     | Your Gmail address                             | `petsos@gmail.com`      | Yes      |
| `EMAIL_PASSWORD` | 16-character App Password from Google          | `abcd efgh ijkl mnop`   | Yes      |
| `EMAIL_FROM`     | Sender email address (shown in "From" field)   | `noreply@petsos.com`    | Yes      |
| `ADMIN_EMAIL`    | Admin email to receive ONG registration alerts | `admin@petsos.com`      | Yes      |
| `FRONTEND_URL`   | Frontend URL for links in emails               | `http://localhost:4200` | Yes      |

---

## Email Features

### 1. ONG Registration Flow

When an ONG registers:

1. **Welcome Email** → Sent to the ONG

   - Subject: "Bem-vindo ao Aubrigo!"
   - Content: Registration confirmation, pending approval notice

2. **Admin Notification** → Sent to `ADMIN_EMAIL`
   - Subject: "Nova ONG Registrada: [ONG Name]"
   - Content: ONG details, action required notice

### 2. ONG Approval Flow

When admin approves an ONG:

- **Approval Email** → Sent to the ONG
  - Subject: "🎉 Conta Aprovada - Aubrigo"
  - Content: Account activated, login link

### 3. ONG Rejection Flow

When admin rejects an ONG:

- **Rejection Email** → Sent to the ONG
  - Subject: "Atualização sobre sua Conta - Aubrigo"
  - Content: Rejection notice with optional reason

### 4. Password Reset Flow

When user requests password reset:

- **Reset Email** → Sent to user
  - Subject: "Redefinir Senha - Aubrigo"
  - Content: Secure reset link (expires in 1 hour)

### 5. Appointment Flow

When visitor schedules appointment:

1. **Confirmation Email** → Sent to visitor

   - Subject: "Confirmação de Visita - [Pet Name]"
   - Content: Appointment details

2. **Notification Email** → Sent to ONG
   - Subject: "Nova Solicitação de Visita - [Pet Name]"
   - Content: Visitor details, appointment info

### 6. Donation Flow

When donation is completed:

- **Receipt Email** → Sent to donor
  - Subject: "Recibo de Doação - Aubrigo"
  - Content: Donation details, transaction ID

---

## Testing Email

### Method 1: Manual Testing via API

1. **Start the backend server:**

   ```bash
   cd backend
   npm run start:dev
   ```

2. **Test ONG Registration** (triggers 2 emails):

   ```bash
   curl -X POST http://localhost:3000/api/auth/register-ong \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test-ong@example.com",
       "password": "Password123!",
       "confirmPassword": "Password123!",
       "ongName": "Test Animal Shelter",
       "phone": "912345678",
       "location": "Lisboa",
       "instagramHandle": "testong"
     }'
   ```

   This should send:

   - Welcome email to `test-ong@example.com`
   - Admin notification to `ADMIN_EMAIL`

3. **Check your inbox** for both emails

### Method 2: Check Logs

The email service logs all email operations:

```
[EmailService] Email sent successfully to test-ong@example.com: Bem-vindo ao Aubrigo!
[EmailService] Email sent successfully to admin@petsos.com: Nova ONG Registrada: Test Animal Shelter
```

If emails fail:

```
[EmailService] Failed to send email to test-ong@example.com: [error details]
```

### Method 3: Test Password Reset

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@gmail.com"}'
```

---

## Troubleshooting

### Problem: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solution:**

- Make sure you're using the **App Password**, not your regular Gmail password
- Ensure 2-Step Verification is enabled on your Google account
- Regenerate a new App Password and update `.env`

### Problem: "Connection timeout" or "ETIMEDOUT"

**Solution:**

- Check if port 587 is blocked by your firewall
- Try port 465 with `secure: true` in the transporter config
- Ensure you have internet connectivity

### Problem: Emails not being sent (no errors in logs)

**Solution:**

- Check if `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Verify `.env` file is loaded (check `console.log(process.env.EMAIL_USER)`)
- Ensure email service is initialized: look for `[EmailService] Email service initialized` in logs

### Problem: Admin doesn't receive ONG registration emails

**Solution:**

- Verify `ADMIN_EMAIL` is set correctly in `.env`
- Check spam folder
- Test with a different email address
- Check server logs for email sending errors

### Problem: "Email not sent (no transporter)"

**Solution:**

- This means `EMAIL_USER` or `EMAIL_PASSWORD` is missing
- Check your `.env` file and ensure all variables are set
- Restart the backend server after updating `.env`

### Problem: Gmail security alerts

**Solution:**

- This is normal when using App Passwords
- Allow the login in Gmail security settings
- Consider using a dedicated Gmail account for the application

---

## Email Template Customization

All email templates are defined in `/backend/src/email/email.service.ts`.

To customize an email:

1. Open `email.service.ts`
2. Find the method (e.g., `sendWelcomeEmailToOng`)
3. Edit the `html` variable with your custom HTML
4. Restart the backend server

**Tips:**

- Use inline CSS (Gmail strips out `<style>` tags)
- Test on multiple email clients (Gmail, Outlook, Apple Mail)
- Keep emails under 102KB for best deliverability
- Use semantic HTML for better accessibility

---

## Production Considerations

### 1. Use a Dedicated Gmail Account

Create a separate Gmail account specifically for Aubrigo emails:

- Example: `petsos.noreply@gmail.com`
- Don't use your personal Gmail account

### 2. Email Sending Limits

Gmail SMTP has daily limits:

- **Free Gmail**: 500 emails per day
- **Google Workspace**: 2,000 emails per day

For higher volume, consider:

- **SendGrid** (up to 100 emails/day free, then paid)
- **AWS SES** (pay-per-email, very cheap)
- **Mailgun** (good for transactional emails)

### 3. Monitor Email Deliverability

- Check bounce rates
- Monitor spam complaints
- Use proper SPF, DKIM, DMARC records (if using custom domain)

### 4. Email Queue (Optional Enhancement)

For production, consider adding a queue system:

- **Bull** (Redis-based queue)
- **AWS SQS**
- This prevents blocking API requests while sending emails

---

## Advanced Configuration

### Using a Custom Domain

To send from `@petsos.com` instead of `@gmail.com`:

1. Set up **Google Workspace** or **Gmail SMTP relay**
2. Configure SPF record:
   ```
   v=spf1 include:_spf.google.com ~all
   ```
3. Configure DKIM signing
4. Update `EMAIL_FROM` to `noreply@petsos.com`

### Switching to SendGrid

If you prefer SendGrid:

1. Create a SendGrid account
2. Generate an API key
3. Update `email.service.ts`:
   ```typescript
   // Replace nodemailer transporter with:
   import sgMail from "@sendgrid/mail";
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   ```
4. Update `.env`:
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review server logs: `npm run start:dev`
3. Test with a simple curl command
4. Verify `.env` variables are loaded

For Gmail-specific issues:

- [Google App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

## Summary Checklist

- [ ] 2-Step Verification enabled on Gmail
- [ ] App Password generated
- [ ] `.env` file configured with all variables
- [ ] Backend server restarted after `.env` changes
- [ ] Test email sent successfully
- [ ] Admin receives ONG registration notifications
- [ ] ONGs receive welcome emails
- [ ] Password reset emails working
- [ ] Checked spam folder if emails not received

---

**Last Updated:** November 5, 2025
**Maintained By:** Aubrigo Development Team
