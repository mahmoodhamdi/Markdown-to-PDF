# Self-Hosting Guide

This guide explains how to deploy Markdown to PDF on your own infrastructure.

## Prerequisites

- Node.js 18+ or Docker
- PostgreSQL or Firebase (for database)
- Chrome/Chromium (for PDF generation)
- SSL certificate (for production)

## Deployment Options

### Option 1: Docker (Recommended)

#### Pull and Run

```bash
# Pull the official image
docker pull mwmsoftware/markdown-to-pdf:latest

# Run with environment variables
docker run -d \
  --name md2pdf \
  -p 3000:3000 \
  -e NEXTAUTH_URL=https://your-domain.com \
  -e NEXTAUTH_SECRET=your-secret-key \
  -e FIREBASE_PROJECT_ID=your-project \
  -e FIREBASE_CLIENT_EMAIL=your-email \
  -e FIREBASE_PRIVATE_KEY="your-key" \
  mwmsoftware/markdown-to-pdf:latest
```

#### Build Your Own Image

```bash
# Clone the repository
git clone https://github.com/mahmoodhamdi/Markdown-to-PDF.git
cd Markdown-to-PDF

# Build the image
docker build -f docker/Dockerfile -t my-md2pdf .

# Run
docker run -d -p 3000:3000 my-md2pdf
```

### Option 2: Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  md2pdf:
    image: mwmsoftware/markdown-to-pdf:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXT_PUBLIC_FIREBASE_API_KEY=${FIREBASE_API_KEY}
      - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}
      - NEXT_PUBLIC_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

### Option 3: Node.js Direct

```bash
# Clone and install
git clone https://github.com/mahmoodhamdi/Markdown-to-PDF.git
cd Markdown-to-PDF
npm install

# Build for production
npm run build

# Start
npm start
```

For production, use a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "md2pdf" -- start
pm2 save
pm2 startup
```

### Option 4: Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: md2pdf
spec:
  replicas: 3
  selector:
    matchLabels:
      app: md2pdf
  template:
    metadata:
      labels:
        app: md2pdf
    spec:
      containers:
      - name: md2pdf
        image: mwmsoftware/markdown-to-pdf:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: md2pdf-secrets
              key: nextauth-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: md2pdf
spec:
  selector:
    app: md2pdf
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | Full URL of your deployment (e.g., `https://md2pdf.yourcompany.com`) |
| `NEXTAUTH_SECRET` | Random 32+ character string for session encryption |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key (JSON escaped) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public URL for the app | Same as NEXTAUTH_URL |
| `PUPPETEER_EXECUTABLE_PATH` | Path to Chrome/Chromium | Auto-detected |
| `STRIPE_SECRET_KEY` | Stripe API key | Billing disabled |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Required for billing |
| `EMAIL_SERVER_HOST` | SMTP server host | Email disabled |
| `EMAIL_SERVER_PORT` | SMTP server port | 587 |
| `EMAIL_SERVER_USER` | SMTP username | - |
| `EMAIL_SERVER_PASSWORD` | SMTP password | - |
| `EMAIL_FROM` | Sender email address | - |

## Database Setup

### Firebase (Default)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Firebase Storage (for cloud storage feature)
4. Create a service account and download the JSON key
5. Extract credentials:
   - `FIREBASE_PROJECT_ID`: Your project ID
   - `FIREBASE_CLIENT_EMAIL`: Service account email
   - `FIREBASE_PRIVATE_KEY`: Private key (escape newlines)

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User files
    match /user_files/{fileId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }

    // Teams
    match /teams/{teamId} {
      allow read: if request.auth != null
        && request.auth.uid in resource.data.memberIds;
      allow write: if request.auth != null
        && request.auth.uid == resource.data.ownerId;
    }

    // SSO configurations (admin only)
    match /sso_configurations/{configId} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.plan == 'enterprise';
    }
  }
}
```

## Reverse Proxy Configuration

### Nginx

```nginx
server {
    listen 80;
    server_name md2pdf.yourcompany.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name md2pdf.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/md2pdf.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/md2pdf.yourcompany.com/privkey.pem;

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

        # Increase timeouts for PDF generation
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Increase body size for file uploads
    client_max_body_size 100M;
}
```

### Traefik (Docker Labels)

```yaml
services:
  md2pdf:
    image: mwmsoftware/markdown-to-pdf:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.md2pdf.rule=Host(`md2pdf.yourcompany.com`)"
      - "traefik.http.routers.md2pdf.entrypoints=websecure"
      - "traefik.http.routers.md2pdf.tls.certresolver=letsencrypt"
      - "traefik.http.services.md2pdf.loadbalancer.server.port=3000"
```

## Scaling Considerations

### Horizontal Scaling

The application is stateless and can be horizontally scaled. However:

1. **Session Storage**: Uses JWT by default, so sessions work across instances
2. **PDF Generation**: CPU-intensive, consider dedicated worker nodes
3. **File Storage**: Use Firebase Storage or S3 for shared file access
4. **Rate Limiting**: Default in-memory; use Redis for distributed rate limiting

### Resource Requirements

| Tier | CPU | Memory | Concurrent Users |
|------|-----|--------|------------------|
| Small | 1 core | 1 GB | 10-50 |
| Medium | 2 cores | 2 GB | 50-200 |
| Large | 4 cores | 4 GB | 200-500 |

### PDF Generation Optimization

For high-volume PDF generation:

1. Enable browser pooling (configured by default)
2. Consider dedicated PDF worker pods
3. Adjust `PUPPETEER_POOL_SIZE` environment variable (default: 3)

## Security Hardening

### Network Security

- Deploy behind a firewall
- Only expose port 443 (HTTPS)
- Use private networking for database access

### Application Security

- Change `NEXTAUTH_SECRET` to a strong random value
- Enable CORS restrictions for API
- Configure CSP headers in your reverse proxy

### Data Security

- Enable Firebase security rules
- Regular database backups
- Encrypt sensitive data at rest

## Monitoring

### Health Check Endpoint

```bash
curl https://md2pdf.yourcompany.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Recommended Monitoring Tools

- **Uptime**: UptimeRobot, Pingdom
- **APM**: Sentry, Datadog
- **Logs**: ELK Stack, Loki
- **Metrics**: Prometheus + Grafana

## Backup and Recovery

### Database Backup

```bash
# Firebase: Export Firestore data
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)
```

### Restore

```bash
# Restore from backup
gcloud firestore import gs://your-bucket/backups/20240101
```

## Troubleshooting

### Common Issues

**PDF generation fails**
- Ensure Chrome/Chromium is installed
- Check `PUPPETEER_EXECUTABLE_PATH` if using custom Chrome
- Verify container has enough memory (min 1GB)

**Authentication errors**
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check `NEXTAUTH_SECRET` is set
- Ensure Firebase credentials are correct

**File uploads fail**
- Check Firebase Storage is enabled
- Verify storage rules allow authenticated uploads
- Check file size limits in reverse proxy

### Debug Mode

Set `NODE_ENV=development` for verbose logging.

## Support

For enterprise support, contact: mwm.softwars.solutions@gmail.com

## License

MIT License - see [LICENSE](LICENSE) for details.
