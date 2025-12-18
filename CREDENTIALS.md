# External Services Credentials

This document lists all external services and credentials required to run the Markdown-to-PDF application with full functionality.

> **Note:** The minimum required credentials for basic functionality are Firebase. All other services are optional and enable additional features.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# GitHub OAuth (for GitHub login)
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret

# Google OAuth (for Google login)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Firebase Configuration (Client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email Configuration (SMTP for password reset, notifications)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com

# Stripe (for payments) - Required for monetization
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
```

## Service Setup Instructions

### 1. Firebase

**Required for:** User authentication, user data storage (Firestore)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
4. Create a Firestore database:
   - Go to Firestore Database
   - Create database in production mode
5. Get client configuration:
   - Go to Project Settings > General
   - Scroll to "Your apps" and create a Web app
   - Copy the `firebaseConfig` values
6. Generate Admin SDK key:
   - Go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Copy `client_email` and `private_key` to env vars

### 2. GitHub OAuth

**Required for:** GitHub login

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: Markdown to PDF
   - Homepage URL: http://localhost:3000 (or your domain)
   - Authorization callback URL: http://localhost:3000/api/auth/callback/github
4. Copy Client ID and generate a Client Secret

### 3. Google OAuth

**Required for:** Google login

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to "APIs & Services" > "Credentials"
4. Create "OAuth client ID" (Web application)
5. Add authorized redirect URI: http://localhost:3000/api/auth/callback/google
6. Copy Client ID and Client Secret

### 4. Stripe

**Required for:** Payment processing, subscriptions

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account if needed
3. Get API keys from Developers > API keys
4. Create Products and Prices:
   - Pro Plan: $5/month, $48/year
   - Team Plan: $15/month, $144/year
   - Enterprise Plan: $99/month, $948/year
5. Set up webhook:
   - Go to Developers > Webhooks
   - Add endpoint: https://your-domain.com/api/webhooks/stripe
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret

### 5. Email (SMTP)

**Required for:** Password reset, notifications

For Gmail:
1. Enable 2-factor authentication
2. Generate App Password: Google Account > Security > App passwords
3. Use app password as `EMAIL_SERVER_PASSWORD`

For other providers, use their SMTP credentials.

## Development vs Production

### Development
- Use Firebase test project
- Use Stripe test mode (test API keys)
- Use localhost URLs for OAuth redirects
- Set `NEXTAUTH_URL=http://localhost:3000`

### Production
- Use Firebase production project
- Switch to Stripe live mode
- Update OAuth redirect URLs to production domain
- Set `NEXTAUTH_URL=https://your-domain.com`
- Enable HTTPS

## Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Rotate secrets regularly** - Especially `NEXTAUTH_SECRET`
3. **Use environment variables in production** - Vercel, Railway, etc. have built-in secret management
4. **Restrict Firebase rules** - Set up proper Firestore security rules
5. **Monitor Stripe webhooks** - Check for failed webhook deliveries

## Feature Availability by Credentials

| Feature | Required Credentials |
|---------|---------------------|
| Basic conversion | None |
| User accounts | Firebase |
| GitHub login | GitHub OAuth + Firebase |
| Google login | Google OAuth + Firebase |
| Usage tracking | Firebase |
| Payments | Stripe |
| Email notifications | SMTP |

## Troubleshooting

### Firebase Admin SDK Error
```
Service account object must contain a string "project_id" property.
```
**Solution:** Ensure all Firebase environment variables are set, especially `FIREBASE_PROJECT_ID`.

### OAuth Callback Error
```
Error: Callback URL mismatch
```
**Solution:** Check that OAuth redirect URLs in provider settings match your `NEXTAUTH_URL`.

### Stripe Webhook Error
```
Webhook signature verification failed
```
**Solution:** Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint's signing secret.

### Email Not Sending
```
Error: Connection refused
```
**Solution:**
- For Gmail, ensure you're using an App Password, not your regular password
- Check SMTP port is correct (587 for TLS, 465 for SSL)
- Verify firewall allows outbound connections on SMTP port

## Quick Start (Minimal Setup)

For development without payments or email:

```bash
# Minimum required (.env.local)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-char-secret-key-here-xxx

# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Then run:
```bash
npm run dev
```

## Contact

For help setting up credentials: mwm.softwars.solutions@gmail.com
