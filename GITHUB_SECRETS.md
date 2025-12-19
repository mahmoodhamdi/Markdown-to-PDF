# GitHub Repository Secrets

Add these secrets to your GitHub repository for CI/CD and Vercel deployment.

## How to Add Secrets

1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret below

---

## Required Secrets

### NextAuth
| Secret Name | Value |
|-------------|-------|
| `NEXTAUTH_URL` | `https://your-domain.com` (production URL) |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |

### MongoDB
| Secret Name | Value |
|-------------|-------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/markdown-to-pdf` |

### GitHub OAuth
| Secret Name | Value |
|-------------|-------|
| `AUTH_GITHUB_ID` | Your GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | Your GitHub OAuth App Client Secret |

> **Note:** GitHub doesn't allow secret names starting with `GITHUB_`, so we use `AUTH_GITHUB_*`

### Google OAuth
| Secret Name | Value |
|-------------|-------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID (ends with `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |

---

## Optional Secrets

### Email (SMTP)
| Secret Name | Value |
|-------------|-------|
| `EMAIL_SERVER_HOST` | `smtp.gmail.com` |
| `EMAIL_SERVER_PORT` | `587` |
| `EMAIL_SERVER_USER` | Your email address |
| `EMAIL_SERVER_PASSWORD` | App password (not your regular password) |
| `EMAIL_FROM` | Your email address |

### Stripe (Payments)
| Secret Name | Value |
|-------------|-------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |

### Cloudinary (File Storage)
| Secret Name | Value |
|-------------|-------|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

---

## Vercel Environment Variables

If deploying to Vercel, add these same values in:
1. Go to your Vercel project
2. Click **Settings** > **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development**

---

## Security Notes

1. **Never commit secrets to git** - Use `.env.local` for local development
2. **Rotate secrets regularly** - Especially after any exposure
3. **Use different secrets for production** - Don't reuse development credentials
4. **Update Google OAuth redirect URIs** - Add production URL to Google Cloud Console
