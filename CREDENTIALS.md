# External Services Credentials

This document lists all external services and credentials required to run the Markdown-to-PDF application with full functionality.

> **Note:** The minimum required credentials for basic functionality are MongoDB. All other services are optional and enable additional features.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-min-32-characters

# MongoDB Configuration (Database)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/markdown-to-pdf?retryWrites=true&w=majority
# Or for local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/markdown-to-pdf

# GitHub OAuth (for GitHub login)
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret

# Google OAuth (for Google login)
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Cloud Storage (Cloudinary for file storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

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

### 1. MongoDB Atlas (Database)

**Required for:** User data storage, teams, analytics, SSO configurations

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Create a new cluster (free tier available)
4. Click "Connect" > "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Add your IP address to Network Access (or allow from anywhere: 0.0.0.0/0)

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

#### Option B: Local MongoDB

1. Install MongoDB Community Server
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/markdown-to-pdf`

### 2. GitHub OAuth

**Required for:** GitHub login

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name:** Markdown to PDF
   - **Homepage URL:** http://localhost:3000 (or your domain)
   - **Authorization callback URL:** http://localhost:3000/api/auth/callback/github
4. Click "Register application"
5. Copy **Client ID**
6. Click "Generate a new client secret"
7. Copy **Client Secret** (save it immediately, it won't be shown again)

### 3. Google OAuth (Detailed Setup)

**Required for:** Google login

#### Step 1: Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" > "New Project"
3. Enter project name: "Markdown to PDF"
4. Click "Create"

#### Step 2: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type > Click "Create"
3. Fill in:
   - **App name:** Markdown to PDF
   - **User support email:** your-email@gmail.com
   - **Developer contact email:** your-email@gmail.com
4. Click "Save and Continue"
5. Skip "Scopes" > Click "Save and Continue"
6. Skip "Test users" > Click "Save and Continue"

#### Step 3: Create OAuth Client ID
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select **Application type:** Web application
4. Enter **Name:** Markdown to PDF Web Client
5. **Authorised JavaScript origins:**
   - `http://localhost:3000` (for development)
   - `https://your-domain.com` (for production)
6. **Authorised redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-domain.com/api/auth/callback/google` (for production)
7. Click "Create"
8. Copy **Client ID** and **Client Secret**

**Example values:**
```
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
```

### 4. Cloudinary (File Storage)

**Required for:** Cloud storage feature (Pro+ plans)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Go to Dashboard
4. Copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 5. Stripe (Payments)

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
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret

### 6. Email (SMTP)

**Required for:** Password reset, notifications

#### For Gmail:
1. Enable 2-factor authentication on your Google Account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and your device
4. Click "Generate"
5. Use the 16-character app password as `EMAIL_SERVER_PASSWORD`

#### For other providers:
Use their SMTP credentials (Sendgrid, Mailgun, etc.)

## Development vs Production

### Development
- Use MongoDB Atlas free tier or local MongoDB
- Use Stripe test mode (test API keys starting with `pk_test_` and `sk_test_`)
- Use localhost URLs for OAuth redirects
- Set `NEXTAUTH_URL=http://localhost:3000`

### Production
- Use MongoDB Atlas production cluster with proper security
- Switch to Stripe live mode
- Update OAuth redirect URLs to production domain
- Set `NEXTAUTH_URL=https://your-domain.com`
- Enable HTTPS

## Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Rotate secrets regularly** - Especially `NEXTAUTH_SECRET`
3. **Use environment variables in production** - Vercel, Railway, etc. have built-in secret management
4. **Restrict MongoDB access** - Use IP whitelisting and strong passwords
5. **Monitor Stripe webhooks** - Check for failed webhook deliveries

## Feature Availability by Credentials

| Feature | Required Credentials |
|---------|---------------------|
| Basic conversion | None |
| User accounts | MongoDB |
| GitHub login | GitHub OAuth + MongoDB |
| Google login | Google OAuth + MongoDB |
| Usage tracking | MongoDB |
| Cloud storage | Cloudinary + MongoDB |
| Payments | Stripe |
| Email notifications | SMTP |

## Database Collections (MongoDB)

The application uses the following collections:

| Collection | Purpose |
|------------|---------|
| `users` | User accounts and profiles |
| `teams` | Team information |
| `team_members` | Team membership records |
| `user_files` | File metadata |
| `storage_quota` | Storage usage tracking |
| `usage_events` | Individual usage events |
| `daily_usage` | Aggregated daily usage |
| `sso_configurations` | SSO/SAML settings |
| `sso_domains` | Domain mappings for SSO |
| `sso_audit_logs` | SSO activity logs |

## Troubleshooting

### MongoDB Connection Error
```
MongoServerError: bad auth : Authentication failed
```
**Solution:**
- Check username/password in connection string
- Ensure user has correct database permissions
- Check if IP is whitelisted in MongoDB Atlas

### OAuth Callback Error
```
Error: Callback URL mismatch
```
**Solution:** Check that OAuth redirect URLs in provider settings match your `NEXTAUTH_URL` exactly.

### Google OAuth "Access Blocked" Error
```
Access blocked: This app's request is invalid
```
**Solution:**
- Verify redirect URI matches exactly (including trailing slash)
- Make sure OAuth consent screen is configured
- For production, you may need to verify your app

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
NEXTAUTH_SECRET=your-32-character-secret-key-here

# MongoDB (required)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/md2pdf

# At least one OAuth provider (GitHub is easiest)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

Then run:
```bash
npm install
npm run dev
```

## Contact

For help setting up credentials: mwm.softwars.solutions@gmail.com
