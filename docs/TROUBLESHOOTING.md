# Troubleshooting Guide

This guide covers common issues and their solutions for Markdown-to-PDF.

## PDF Generation Issues

### PDF generation fails or times out

**Symptoms:**
- Error: "PDF generation failed"
- Request times out after 30+ seconds
- Empty PDF returned

**Solutions:**

1. **Check Puppeteer installation**
   ```bash
   # Verify Chrome/Chromium is accessible
   npx puppeteer browsers install chrome
   ```

2. **Set explicit Chrome path**
   ```bash
   # In .env
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   # Or on Windows
   PUPPETEER_EXECUTABLE_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
   ```

3. **Check system dependencies (Linux)**
   ```bash
   # Install required libraries
   sudo apt-get update
   sudo apt-get install -y \
     libnss3 \
     libatk1.0-0 \
     libatk-bridge2.0-0 \
     libcups2 \
     libdrm2 \
     libxkbcommon0 \
     libxcomposite1 \
     libxdamage1 \
     libxrandr2 \
     libgbm1 \
     libasound2
   ```

4. **Increase memory limits**
   ```bash
   # For Node.js
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

5. **Check browser pool status**
   - The app uses browser pooling for efficiency
   - Restart the application if pool becomes corrupted

### Large documents fail

**Symptoms:**
- Works for small files, fails for large ones
- Memory errors

**Solutions:**

1. **Increase timeout**
   ```typescript
   // In conversion options
   { timeout: 60000 } // 60 seconds
   ```

2. **Split large documents**
   - Use batch conversion for multiple smaller files
   - Consider pagination for very long documents

3. **Check plan limits**
   - Free tier: 5MB max file size
   - Pro tier: 25MB max file size
   - Enterprise: 100MB max file size

### Fonts not rendering correctly

**Symptoms:**
- Missing characters
- Wrong font family
- RTL text issues

**Solutions:**

1. **Install system fonts (Linux)**
   ```bash
   sudo apt-get install -y fonts-noto fonts-liberation
   ```

2. **For Arabic/RTL support**
   ```bash
   sudo apt-get install -y fonts-noto-core fonts-noto-extra
   ```

3. **Use web fonts in themes**
   - Themes load Google Fonts automatically
   - Ensure network access to fonts.googleapis.com

## Database Issues

### MongoDB connection fails

**Symptoms:**
- Error: "MongoNetworkError"
- "Connection refused" errors
- Timeout on startup

**Solutions:**

1. **Verify connection string**
   ```bash
   # Test connection
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net/test"
   ```

2. **Check network connectivity**
   - Whitelist your IP in MongoDB Atlas
   - For development, use 0.0.0.0/0 (allow all)
   - Check firewall rules

3. **Verify credentials**
   - Ensure user has readWrite permissions
   - Check for special characters in password (URL encode them)

4. **Connection string format**
   ```bash
   # Atlas
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/markdown-to-pdf

   # Local
   MONGODB_URI=mongodb://localhost:27017/markdown-to-pdf

   # With auth
   MONGODB_URI=mongodb://user:pass@localhost:27017/markdown-to-pdf?authSource=admin
   ```

### Data not persisting

**Symptoms:**
- Users lose settings after restart
- Usage stats reset unexpectedly

**Solutions:**

1. **Check database name in URI**
   - Ensure consistent database name across environments

2. **Verify write permissions**
   - Database user needs readWrite role

3. **Check disk space**
   - MongoDB needs adequate disk space for writes

## Authentication Issues

### OAuth login fails

**Symptoms:**
- "Callback URL mismatch" error
- Redirect loop after login
- "Invalid client" error

**Solutions:**

1. **GitHub OAuth**
   ```
   # In GitHub OAuth app settings:
   Homepage URL: https://your-domain.com
   Authorization callback URL: https://your-domain.com/api/auth/callback/github
   ```

2. **Google OAuth**
   ```
   # In Google Cloud Console:
   Authorized JavaScript origins: https://your-domain.com
   Authorized redirect URIs: https://your-domain.com/api/auth/callback/google
   ```

3. **Check environment variables**
   ```bash
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-32-char-secret
   GITHUB_ID=your-client-id
   GITHUB_SECRET=your-client-secret
   ```

### Session not persisting

**Symptoms:**
- User logged out unexpectedly
- Session expires too quickly

**Solutions:**

1. **Check NEXTAUTH_SECRET**
   - Must be at least 32 characters
   - Must be consistent across deployments
   - Generate with: `openssl rand -base64 32`

2. **Check cookies**
   - Ensure HTTPS in production
   - Check browser cookie settings
   - Clear cookies and try again

3. **Verify NEXTAUTH_URL**
   - Must match the exact domain being accessed
   - Include https:// prefix

### Password reset not working

**Symptoms:**
- Reset email not received
- "Token invalid" error
- Token expired

**Solutions:**

1. **Check email configuration**
   ```bash
   EMAIL_SERVER_HOST=smtp.example.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-user
   EMAIL_SERVER_PASSWORD=your-password
   EMAIL_FROM=noreply@your-domain.com
   ```

2. **Check spam folder**
   - Reset emails may be marked as spam

3. **Token expiry**
   - Password reset tokens expire after 1 hour
   - Request a new token if expired

## Storage Issues

### File upload fails

**Symptoms:**
- "Upload failed" error
- Timeout during upload
- "Permission denied" error

**Solutions:**

1. **Check Firebase configuration**
   ```bash
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-admin@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

2. **Check storage rules**
   - Ensure authenticated users can write to their folder
   - Check quota limits

3. **Check file size**
   - Free tier: 50MB storage total
   - Pro tier: 5GB storage total

### Storage quota exceeded

**Symptoms:**
- "Storage quota exceeded" error
- Cannot upload new files

**Solutions:**

1. **Delete old files**
   - Go to Dashboard > Files
   - Delete unused files

2. **Upgrade plan**
   - Higher tiers have more storage

3. **Export and delete**
   - Download important files
   - Delete from cloud storage

## Payment Issues

### Checkout fails

**Symptoms:**
- Redirect to checkout fails
- "Invalid session" error
- Payment not processed

**Solutions:**

1. **Check Stripe configuration**
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Verify webhook setup**
   ```bash
   # Webhook endpoint
   https://your-domain.com/api/webhooks/stripe

   # Required events:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```

3. **Check webhook signature**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Subscription not activated

**Symptoms:**
- Payment succeeded but plan not upgraded
- Pro features not available

**Solutions:**

1. **Check webhook logs**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Check for failed webhook deliveries

2. **Manual sync**
   - Contact support for manual subscription sync

3. **Verify user email**
   - Stripe customer email must match account email

## Performance Issues

### Slow page loads

**Symptoms:**
- Pages take > 3 seconds to load
- Initial load very slow

**Solutions:**

1. **Check network**
   - Verify CDN is working (Vercel/Cloudflare)
   - Check server location vs user location

2. **Database optimization**
   - Ensure indexes are created
   - Check query performance in MongoDB Atlas

3. **Reduce bundle size**
   ```bash
   # Analyze bundle
   npm run build
   # Check .next/analyze for bundle analysis
   ```

### API rate limiting

**Symptoms:**
- 429 Too Many Requests errors
- Temporary blocks

**Solutions:**

1. **Check rate limits**
   - Free: 10 conversions/day
   - Pro: 100 conversions/day
   - Enterprise: Unlimited

2. **Use API keys efficiently**
   - Cache results when possible
   - Batch multiple conversions

3. **Upgrade plan**
   - Higher tiers have higher rate limits

## Development Issues

### Build fails

**Symptoms:**
- TypeScript errors
- Module not found

**Solutions:**

1. **Clear cache**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

2. **Check Node version**
   ```bash
   node --version
   # Should be 18.x or later
   ```

3. **Check TypeScript**
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

### Tests failing

**Symptoms:**
- Unit tests fail locally
- Integration tests timeout

**Solutions:**

1. **Reset test environment**
   ```bash
   npm run test:unit -- --reporter=verbose
   ```

2. **Check test database**
   - Integration tests may need MongoDB running
   - E2E tests need the dev server

3. **Increase timeout**
   ```bash
   npm run test:integration -- --testTimeout=60000
   ```

### Hot reload not working

**Symptoms:**
- Changes not reflected
- Need to restart dev server

**Solutions:**

1. **Check file watchers**
   ```bash
   # Linux: increase inotify limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart dev server**
   ```bash
   # Kill existing process
   pkill -f "next dev"
   npm run dev
   ```

## Getting Help

If your issue isn't covered here:

1. **Check existing issues**: [GitHub Issues](https://github.com/your-org/markdown-to-pdf/issues)
2. **Create new issue**: Include error messages, environment details, and steps to reproduce
3. **Contact support**: For enterprise customers, contact support@your-domain.com

## Diagnostic Information

When reporting issues, include:

```bash
# Node version
node --version

# npm version
npm --version

# OS info
uname -a  # Linux/Mac
ver       # Windows

# Environment
echo $NODE_ENV

# Application logs (recent errors)
tail -100 ~/.pm2/logs/markdown-to-pdf-error.log
```
