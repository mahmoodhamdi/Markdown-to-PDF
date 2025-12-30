# Deployment Guide

This guide covers deploying Markdown-to-PDF to production environments.

## Prerequisites

- Node.js 18.x or later
- MongoDB database (Atlas recommended for production)
- Firebase project (for file storage)
- Domain name with SSL certificate
- Payment gateway accounts (optional):
  - Stripe (global payments)
  - Paymob (Egypt)
  - PayTabs (MENA region)
  - Paddle (EU, Merchant of Record)

## Environment Variables

Create a `.env.production` file with:

```bash
# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret-32-chars-min

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/markdown-to-pdf

# Firebase Storage
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-admin@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OAuth Providers
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (SMTP)
EMAIL_SERVER_HOST=smtp.your-provider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email-user
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@your-domain.com

# Payment Gateways (optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Rate Limiting (optional, recommended)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# PDF Generation
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment with automatic CI/CD.

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `main` branch

2. **Configure Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.production`
   - Mark sensitive values as "Secret"

3. **Configure Build Settings**
   ```
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm ci
   ```

4. **Deploy**
   - Push to main branch to trigger deployment
   - Or use `vercel --prod` CLI command

**Vercel-specific considerations:**
- Serverless functions have 10s timeout (Pro: 60s, Enterprise: 900s)
- PDF generation may timeout on free tier for large documents
- Use Edge Functions for global low-latency

### Option 2: Docker

Use Docker for self-hosted or cloud VM deployments.

1. **Build the Image**
   ```bash
   docker build -t markdown-to-pdf -f docker/Dockerfile .
   ```

2. **Run with Docker Compose**
   ```bash
   # Production mode
   docker-compose -f docker/docker-compose.prod.yml up -d
   ```

3. **docker-compose.prod.yml example:**
   ```yaml
   version: '3.8'
   services:
     app:
       build:
         context: .
         dockerfile: docker/Dockerfile
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production
       restart: unless-stopped
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   ```

### Option 3: Cloud VMs (AWS/GCP/Azure)

1. **Provision VM**
   - Recommended: 2 vCPUs, 4GB RAM minimum
   - Ubuntu 22.04 LTS or Debian 12

2. **Install Dependencies**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Chromium for Puppeteer
   sudo apt-get install -y chromium-browser

   # PM2 for process management
   sudo npm install -g pm2
   ```

3. **Deploy Application**
   ```bash
   git clone https://github.com/your-org/markdown-to-pdf.git
   cd markdown-to-pdf
   npm ci --production
   npm run build
   pm2 start npm --name "markdown-to-pdf" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Reverse Proxy (nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 4: Railway/Render

Both platforms offer simple deployment with free tiers.

**Railway:**
```bash
railway login
railway init
railway up
```

**Render:**
1. Connect GitHub repository
2. Select "Web Service"
3. Use build command: `npm ci && npm run build`
4. Use start command: `npm start`

## Database Setup

### MongoDB Atlas (Recommended)

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Create database user with read/write permissions
4. Whitelist IP addresses (or use 0.0.0.0/0 for all)
5. Get connection string and add to `MONGODB_URI`

### Self-hosted MongoDB

```bash
# Install MongoDB
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Connection string
MONGODB_URI=mongodb://localhost:27017/markdown-to-pdf
```

## Firebase Setup

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Storage in the Firebase console
3. Generate service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Use the JSON values for environment variables
4. Configure Storage rules:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /users/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## SSL/TLS Configuration

### Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

## Monitoring

### Health Check Endpoint

The application exposes `/api/health` for monitoring:

```bash
curl https://your-domain.com/api/health
# {"status":"ok","timestamp":"..."}
```

### Recommended Monitoring Tools

- **Uptime**: UptimeRobot, Pingdom, or Better Uptime
- **Logs**: Datadog, LogRocket, or Papertrail
- **Errors**: Sentry (add SENTRY_DSN to env)
- **Performance**: Vercel Analytics or New Relic

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (nginx, HAProxy, or cloud LB)
- Ensure session storage is shared (JWT is stateless)
- Use Redis for rate limiting across instances

### PDF Generation

- PDF generation is CPU-intensive
- Consider dedicated workers for batch processing
- Use browser pool for connection reuse (already implemented)
- Set memory limits appropriate for document size

### Database

- Enable MongoDB indexes for frequent queries
- Use read replicas for heavy read workloads
- Consider sharding for very large datasets

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure headers (CSP, HSTS, etc.)
- [ ] Keep dependencies updated
- [ ] Rotate secrets regularly
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment-specific secrets
- [ ] Enable MongoDB authentication
- [ ] Restrict Firebase Storage rules
- [ ] Set up backup strategy

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common deployment issues.
