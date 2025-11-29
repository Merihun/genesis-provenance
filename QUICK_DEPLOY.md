# 🚀 Genesis Provenance - Quick Deploy Checklist

**Total Time:** ~60-90 minutes  
**Difficulty:** Intermediate

---

## 📋 Pre-Flight Checklist

Before starting, ensure you have accounts for:

- [ ] **GitHub** - https://github.com/signup
- [ ] **Vercel** - https://vercel.com/signup
- [ ] **AWS** - https://aws.amazon.com/free
- [ ] **GoDaddy** - Already have (genesisprovenance.com)
- [ ] **Microsoft 365** - Already have

---

# Phase 1: GitHub Setup (⏱️ 10 min)

## Create Repository

```bash
# Navigate to project
cd /home/ubuntu/genesis_provenance/nextjs_space

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Phase 1.5: Self-service model with professional UI/UX"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/genesis-provenance.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**✅ Checkpoint:** Verify code is on GitHub

---

# Phase 2: Database Setup (⏱️ 10 min)

## Option A: Vercel Postgres (Easiest)

1. Go to https://vercel.com/dashboard
2. Click **"Storage"** → **"Create Database"**
3. Select **"Postgres"**
4. Name: `genesis-provenance-db`
5. Region: `US East (iad1)` or closest
6. Click **"Create"**
7. Copy `POSTGRES_PRISMA_URL` value
8. **Save this connection string!**

**✅ Checkpoint:** You have the connection string saved

---

# Phase 3: AWS S3 Setup (⏱️ 15 min)

## Create Bucket

1. Go to https://console.aws.amazon.com/s3
2. Click **"Create bucket"**
3. Name: `genesis-provenance-assets` (must be unique globally)
4. Region: `us-east-1`
5. **Keep "Block all public access" CHECKED**
6. Click **"Create bucket"**

## Configure CORS

1. Click on your bucket
2. Go to **"Permissions"** tab
3. Scroll to **"CORS"**
4. Click **"Edit"** and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://genesisprovenance.com",
      "https://www.genesisprovenance.com",
      "https://app.genesisprovenance.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **"Save"**

## Create IAM User

1. Go to https://console.aws.amazon.com/iam/home#/users
2. Click **"Create user"**
3. Name: `genesis-provenance-s3-user`
4. Click **"Next"**
5. Select **"Attach policies directly"**
6. Search and select: `AmazonS3FullAccess`
7. Click **"Next"** → **"Create user"**
8. Click on the user → **"Security credentials"**
9. Click **"Create access key"**
10. Select **"Application running outside AWS"**
11. Click **"Next"** → **"Create access key"**
12. **COPY BOTH:**
    - Access key ID
    - Secret access key
13. **Save these securely!**

**✅ Checkpoint:** You have AWS Access Key ID and Secret saved

---

# Phase 4: Vercel Deployment (⏱️ 15 min)

## Import to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub account
4. Find `genesis-provenance`
5. Click **"Import"**
6. **DO NOT DEPLOY YET**

## Add Environment Variables

Click **"Environment Variables"** and add these:

### Generate NextAuth Secret First

Run locally:
```bash
openssl rand -base64 32
```
Copy the output.

### Add Variables (one by one):

**1. DATABASE_URL**
```
Value: [Your Postgres connection string from Phase 2]
Environment: Production, Preview, Development
```

**2. NEXTAUTH_URL**
```
Value: https://genesisprovenance.com
Environment: Production
```

**3. NEXTAUTH_SECRET**
```
Value: [Your generated secret from above]
Environment: Production, Preview, Development
```

**4. AWS_ACCESS_KEY_ID**
```
Value: [From Phase 3]
Environment: Production, Preview, Development
```

**5. AWS_SECRET_ACCESS_KEY**
```
Value: [From Phase 3]
Environment: Production, Preview, Development
```

**6. AWS_REGION**
```
Value: us-east-1
Environment: Production, Preview, Development
```

**7. AWS_BUCKET_NAME**
```
Value: genesis-provenance-assets
Environment: Production, Preview, Development
```

**8. NODE_ENV**
```
Value: production
Environment: Production
```

## Deploy!

Click **"Deploy"**

⏳ Wait 3-5 minutes...

**✅ Checkpoint:** Deployment successful, app live at `*.vercel.app`

---

# Phase 5: Database Migration (⏱️ 10 min)

## Run Migrations

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd /home/ubuntu/genesis_provenance/nextjs_space
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations (use your actual DATABASE_URL)
DATABASE_URL="[your-database-url]" npx prisma migrate deploy

# Seed database
DATABASE_URL="[your-database-url]" npx prisma db seed
```

**✅ Checkpoint:** Database has tables and default admin user

---

# Phase 6: Custom Domain (GoDaddy) (⏱️ 20 min)

## Add Domain in Vercel

1. In Vercel Dashboard → Project → **"Settings"** → **"Domains"**
2. Add these domains:
   - `genesisprovenance.com`
   - `www.genesisprovenance.com` (redirect to main)
   - `app.genesisprovenance.com` (optional)
3. Vercel shows required DNS records
4. **COPY THESE VALUES** (will be like):
   ```
   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   CNAME: app → cname.vercel-dns.com
   ```

## Configure GoDaddy DNS

1. Go to https://dcc.godaddy.com/manage/genesisprovenance.com/dns
2. Click **"Add"** for each record:

### A Record
```
Type: A
Name: @
Value: [IP from Vercel]
TTL: 600
```

### CNAME Records
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600

Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 600
```

3. **Delete any conflicting records** (old A records, parking pages, etc.)
4. Click **"Save"**

## Wait for DNS Propagation

⏳ Check status: https://dnschecker.org

- Enter: `genesisprovenance.com`
- Wait for green checkmarks worldwide (10-30 min)

## Verify in Vercel

1. Go back to Vercel → Domains
2. Wait for green checkmarks
3. Click **"Refresh"** if needed

**✅ Checkpoint:** All domains show green checkmarks in Vercel

---

# Phase 7: Email Setup (Microsoft 365) (⏱️ 30 min)

## Verify Domain

1. Go to https://admin.microsoft.com
2. Click **"Settings"** → **"Domains"**
3. Click **"Add domain"**
4. Enter: `genesisprovenance.com`
5. Microsoft shows TXT record for verification
6. Add TXT record to GoDaddy:
   ```
   Type: TXT
   Name: @
   Value: MS=ms12345678 (from Microsoft)
   TTL: 3600
   ```
7. Wait 10 min
8. Click **"Verify"** in Microsoft 365

## Add MX Records

Microsoft provides MX record:
```
Type: MX
Name: @
Value: genesisprovenance-com.mail.protection.outlook.com
Priority: 0
TTL: 3600
```

Add to GoDaddy

## Add SPF Record

```
Type: TXT
Name: @
Value: v=spf1 include:spf.protection.outlook.com -all
TTL: 3600
```

## Add DKIM Records

Microsoft provides 2 CNAME records:
```
Type: CNAME
Name: selector1._domainkey
Value: selector1-genesisprovenance-com._domainkey.[your-tenant].onmicrosoft.com
TTL: 3600

Type: CNAME
Name: selector2._domainkey
Value: selector2-genesisprovenance-com._domainkey.[your-tenant].onmicrosoft.com
TTL: 3600
```

Add both to GoDaddy

## Add DMARC Record

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@genesisprovenance.com
TTL: 3600
```

## Create Email Accounts

1. In Microsoft 365 → **"Users"** → **"Active users"**
2. Click **"Add user"**
3. Create:
   - `admin@genesisprovenance.com`
   - `info@genesisprovenance.com`
   - `support@genesisprovenance.com`
   - `sales@genesisprovenance.com`

**✅ Checkpoint:** Send test email from admin@ to personal email

---

# Phase 8: Testing (⏱️ 15 min)

## Test Checklist

- [ ] **Home page loads:** https://genesisprovenance.com
- [ ] **WWW redirects:** https://www.genesisprovenance.com → main
- [ ] **SSL works:** Green padlock on all domains
- [ ] **Signup works:** Create test account
- [ ] **Login works:** Sign in with test account
- [ ] **Dashboard loads:** After login
- [ ] **Admin access:** Login as `john@doe.com` / `johndoe123`
- [ ] **Admin console:** Visit `/admin` page
- [ ] **Contact form:** Submit and check admin console
- [ ] **Email works:** Send from admin@, receive at info@
- [ ] **Mobile responsive:** Test on phone
- [ ] **Performance:** Run https://pagespeed.web.dev/ (aim for 90+)

**✅ All Tests Passed!**

---

# 🎉 Deployment Complete!

## Your Live URLs:

- **Main Site:** https://genesisprovenance.com
- **WWW:** https://www.genesisprovenance.com
- **App:** https://app.genesisprovenance.com (if configured)
- **Admin:** https://genesisprovenance.com/admin

## Default Credentials:

**Admin Account:**
- Email: `john@doe.com`
- Password: `johndoe123`

**⚠️ Change this password immediately after first login!**

---

## Next Steps:

### Today:
1. Change admin password
2. Create your real admin account
3. Test all features
4. Share with team

### This Week:
1. Set up monitoring (Vercel Analytics)
2. Add error tracking (Sentry - optional)
3. Configure uptime monitoring (UptimeRobot - optional)
4. Start gathering user feedback

### This Month:
1. Begin Phase 2 development:
   - Asset onboarding wizard
   - File upload system
   - Items list/grid
   - Provenance timeline
2. Marketing campaign
3. Customer onboarding

---

## Need Help?

**Detailed Guides:**
- `DEPLOYMENT_GUIDE.md` - Complete step-by-step
- `VERCEL_DEPLOYMENT.md` - Technical deep dive
- `PROJECT_STATUS.md` - Project overview

**Common Issues:**
- DNS not propagating? Wait 30-60 minutes
- SSL error? Click "Refresh" in Vercel Domains
- Database error? Verify DATABASE_URL and re-run migrations
- Email not working? Check MX records and wait 24 hours

**Support Resources:**
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
- GoDaddy: https://www.godaddy.com/help

---

## Summary of What You Deployed:

✅ **Professional Marketing Site**
- Home, Pricing, Product, How It Works
- Self-service signup (no gatekeeping)
- Realistic pricing ($19-499/mo)
- Trust signals & statistics

✅ **Authentication System**
- Email/password login
- Role-based access (collector, reseller, partner, admin)
- Protected dashboard

✅ **Dashboard Application**
- User dashboard with summary cards
- Vault page (ready for Phase 2)
- Settings page
- Admin console

✅ **Database**
- PostgreSQL with Prisma
- Extended schema for Phase 2
- Seeded with default data

✅ **Cloud Storage**
- AWS S3 configured
- Ready for file uploads in Phase 2

✅ **Professional Email**
- Microsoft 365 integration
- Custom domain email addresses
- SPF/DKIM/DMARC configured

---

**Congratulations! 🎉 Genesis Provenance is now live and ready for users!**

---

**Last Updated:** November 29, 2025  
**Deploy Time:** ~90 minutes  
**Status:** ✅ Production Ready
