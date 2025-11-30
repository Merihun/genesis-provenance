# 📧 Resend Email Production Setup Guide

## ✅ **Step 1: API Key Configuration (COMPLETED)**

Your Resend API key has been added to the `.env` file:
```env
RESEND_API_KEY=re_J3xzzw71_KVSunKT7toBpqFS8GGJkC8pV
```

✅ **Status**: API key is configured and ready!

---

## 🌐 **Step 2: Domain Verification in Resend**

### **Overview**
To send emails from your domain (`genesisprovenance.com` or `genesisprovenance.abacusai.app`), you need to verify domain ownership by adding DNS records.

### **Which Domain Should You Use?**

#### **Option A: genesisprovenance.abacusai.app** (Recommended for Quick Start)
- ✅ **Pros**: Already configured in your app, no DNS access needed if Abacus.AI manages it
- ⚠️ **Cons**: Uses `.abacusai.app` subdomain (less professional)
- **Best for**: Testing, quick deployment

#### **Option B: genesisprovenance.com** (Recommended for Production)
- ✅ **Pros**: Professional, branded email address
- ⚠️ **Cons**: Requires DNS record configuration
- **Best for**: Production deployment

---

## 📋 **Step 3: Add Domain to Resend Dashboard**

### **3.1 Login to Resend**
1. Go to **https://resend.com/login**
2. Login with your account credentials

### **3.2 Navigate to Domains**
1. Click on **"Domains"** in the left sidebar
2. Click **"+ Add Domain"** button

### **3.3 Enter Your Domain**
- **For Option A**: Enter `genesisprovenance.abacusai.app`
- **For Option B**: Enter `genesisprovenance.com`

### **3.4 Select Region**
- Choose **"United States (us-east-1)"** (closest to your users)
- Or choose your preferred region

### **3.5 Click "Add"**

---

## 🔐 **Step 4: DNS Records Configuration**

After adding your domain, Resend will display **3 DNS records** you need to add:

### **Record Types You'll See:**

#### **1. SPF Record (TXT)**
**Purpose**: Authorizes Resend to send emails on your behalf

**Example**:
```
Type: TXT
Name: @  (or leave blank for root domain)
Value: v=spf1 include:resend.com ~all
TTL: 3600
```

#### **2. DKIM Record (TXT)**
**Purpose**: Email authentication and anti-spoofing

**Example**:
```
Type: TXT
Name: resend._domainkey
Value: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (long key)
TTL: 3600
```

#### **3. Return-Path Record (CNAME)**
**Purpose**: Bounce handling

**Example**:
```
Type: CNAME
Name: resend
Value: feedback.resend.com
TTL: 3600
```

---

## ⚙️ **Step 5: Add DNS Records**

### **Option A: If using genesisprovenance.abacusai.app**

You'll need to contact **Abacus.AI support** to add these records, as they manage the DNS for `.abacusai.app` subdomains.

**Action Required**:
1. Copy all 3 DNS records from Resend dashboard
2. Send to Abacus.AI support at **support@abacus.ai**
3. Include this message:

```
Subject: DNS Records for Email Setup - genesisprovenance.abacusai.app

Hi Abacus.AI Team,

I need to configure email sending for my Genesis Provenance app deployed at genesisprovenance.abacusai.app.

Please add the following DNS records for email verification with Resend:

[Paste your 3 DNS records here from Resend dashboard]

Thank you!
```

---

### **Option B: If using genesisprovenance.com (via GoDaddy)**

#### **5.1 Login to GoDaddy**
1. Go to **https://www.godaddy.com**
2. Click **"Sign In"**
3. Enter your credentials

#### **5.2 Access DNS Management**
1. Click your profile icon (top right)
2. Select **"My Products"**
3. Find **"genesisprovenance.com"**
4. Click **"DNS"** button next to it

#### **5.3 Add SPF Record**
1. Scroll to **"Records"** section
2. Click **"Add"** button
3. Select:
   - **Type**: TXT
   - **Name**: @ (for root domain)
   - **Value**: Copy from Resend (starts with `v=spf1`)
   - **TTL**: 3600 (or 1 Hour)
4. Click **"Save"**

#### **5.4 Add DKIM Record**
1. Click **"Add"** again
2. Select:
   - **Type**: TXT
   - **Name**: `resend._domainkey` (copy exact name from Resend)
   - **Value**: Copy the long key from Resend (starts with `k=rsa; p=`)
   - **TTL**: 3600
3. Click **"Save"**

#### **5.5 Add Return-Path CNAME**
1. Click **"Add"** again
2. Select:
   - **Type**: CNAME
   - **Name**: `resend` (or exact name from Resend)
   - **Value**: `feedback.resend.com`
   - **TTL**: 3600
3. Click **"Save"**

---

## ✅ **Step 6: Verify DNS Records**

### **6.1 Wait for DNS Propagation**
- DNS changes can take **5-60 minutes** to propagate
- Some providers are faster (e.g., Cloudflare ~2 min, GoDaddy ~15-30 min)

### **6.2 Check DNS Records (Optional)**

You can verify the records were added correctly:

#### **Using Command Line (Mac/Linux)**
```bash
# Check SPF
dig TXT genesisprovenance.com | grep spf1

# Check DKIM
dig TXT resend._domainkey.genesisprovenance.com

# Check CNAME
dig CNAME resend.genesisprovenance.com
```

#### **Using Online Tools**
- **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
- **DNS Checker**: https://dnschecker.org/

### **6.3 Verify in Resend Dashboard**
1. Return to **Resend Dashboard → Domains**
2. Find your domain
3. Click **"Verify Records"** or **"Check Status"**
4. Wait for **green checkmarks** ✅ next to all 3 records
5. Status will change from **"Pending"** to **"Verified"**

**This may take 10-30 minutes after adding DNS records.**

---

## 📝 **Step 7: Update EMAIL_FROM in .env**

### **After Domain is Verified:**

#### **If using genesisprovenance.abacusai.app**
```env
EMAIL_FROM="Genesis Provenance <noreply@genesisprovenance.abacusai.app>"
```

#### **If using genesisprovenance.com**
```env
EMAIL_FROM="Genesis Provenance <noreply@genesisprovenance.com>"
```

### **Update Command:**
```bash
cd /home/ubuntu/genesis_provenance/nextjs_space

# For .abacusai.app domain
sed -i 's|EMAIL_FROM=.*|EMAIL_FROM="Genesis Provenance <noreply@genesisprovenance.abacusai.app>"|' .env

# OR for .com domain
sed -i 's|EMAIL_FROM=.*|EMAIL_FROM="Genesis Provenance <noreply@genesisprovenance.com>"|' .env
```

### **Restart Your App**
```bash
# If running locally
cd nextjs_space
yarn dev

# If on Vercel/production
# Redeploy or restart your app
```

---

## 🧪 **Step 8: Test Email Sending**

### **8.1 Quick Test via Dashboard**
1. Login to your app: https://genesisprovenance.abacusai.app
2. Navigate to **Team Management** (`/team`)
3. Click **"Invite Team Member"**
4. Enter a test email address (use your personal email)
5. Click **"Send Invitation"**
6. Check your email inbox (and spam folder)

### **8.2 What to Look For**
✅ **Subject**: "You've been invited to join [Org Name] on Genesis Provenance"  
✅ **From**: "Genesis Provenance <noreply@genesisprovenance.com>"  
✅ **Content**: Branded HTML email with blue header and CTA button  
✅ **Deliverability**: Email arrives in inbox (not spam)  

### **8.3 Troubleshooting Failed Tests**

#### **"RESEND_API_KEY is not set" Error**
- Restart your development server
- Verify `.env` file is in the correct location
- Check for typos in the API key

#### **"Domain not verified" Error**
- Wait 5-10 more minutes for DNS propagation
- Verify all 3 DNS records in Resend dashboard
- Check DNS records using `dig` or online tools

#### **Email Goes to Spam**
- This is normal for new domains (first few emails)
- Check that all 3 DNS records are verified
- Ask recipient to mark as "Not Spam"
- Email reputation improves over time

---

## 📊 **Step 9: Monitor Email Delivery**

### **Resend Dashboard Analytics**
1. Go to **Resend Dashboard**
2. Click **"Emails"** in sidebar
3. View:
   - **Sent**: Total emails sent
   - **Delivered**: Successfully delivered
   - **Bounced**: Failed deliveries
   - **Opened**: Tracking (if enabled)

### **Free Tier Limits**
- **3,000 emails/month** (free)
- No credit card required
- Upgrade if you need more

### **Monitoring Tips**
- Check **bounce rate** (should be <5%)
- Monitor **delivery rate** (should be >95%)
- Watch for **spam complaints** (should be <0.1%)

---

## 🚀 **Step 10: Production Deployment Checklist**

Before going live, verify:

- [ ] ✅ RESEND_API_KEY is set in production `.env`
- [ ] ✅ Domain is verified in Resend (green checkmarks)
- [ ] ✅ EMAIL_FROM uses verified domain
- [ ] ✅ Test email sent successfully
- [ ] ✅ Email arrives in inbox (not spam)
- [ ] ✅ Invitation link works correctly
- [ ] ✅ Accept invitation flow tested end-to-end
- [ ] ✅ DNS records are stable (no pending changes)
- [ ] ✅ Resend dashboard shows "Verified" status

---

## 💡 **Best Practices**

### **Email Sending**
- ✅ Always use verified domains
- ✅ Include unsubscribe links (for marketing emails)
- ✅ Monitor bounce and complaint rates
- ✅ Warm up new domains gradually (start with low volume)

### **Domain Reputation**
- ✅ Send to engaged users first
- ✅ Avoid sending to purchased lists
- ✅ Handle bounces promptly
- ✅ Keep complaint rate below 0.1%

### **Security**
- ✅ Never expose API keys in client-side code
- ✅ Rotate API keys periodically
- ✅ Use environment variables for all credentials
- ✅ Enable 2FA on Resend account

---

## 🆘 **Troubleshooting Common Issues**

### **Issue 1: DNS Records Not Verifying**

**Symptoms**: Resend shows "Pending" status after 30+ minutes

**Solutions**:
1. Double-check record names (exact match required)
2. Verify TXT record values (no extra spaces)
3. Check TTL is set correctly (3600 recommended)
4. Wait up to 60 minutes for propagation
5. Use `dig` command to verify records are live
6. Contact your DNS provider support

### **Issue 2: Emails Not Sending**

**Symptoms**: No error, but email doesn't arrive

**Solutions**:
1. Check spam folder
2. Verify RESEND_API_KEY is correct
3. Ensure domain is verified (not pending)
4. Check Resend dashboard for error logs
5. Verify EMAIL_FROM matches verified domain
6. Test with different recipient email

### **Issue 3: Emails Go to Spam**

**Symptoms**: Email arrives in spam folder

**Solutions**:
1. Ensure all 3 DNS records are verified
2. Add DMARC record (optional, improves reputation)
3. Send from consistent IP/domain
4. Avoid spam trigger words in subject/content
5. Ask recipients to mark as "Not Spam"
6. Warm up domain with small volume first

### **Issue 4: High Bounce Rate**

**Symptoms**: Many emails bouncing

**Solutions**:
1. Verify recipient email addresses
2. Check for typos in email addresses
3. Remove invalid/old email addresses
4. Monitor bounce reasons in Resend dashboard
5. Implement email validation on signup

---

## 📚 **Additional Resources**

### **Resend Documentation**
- **Getting Started**: https://resend.com/docs/introduction
- **Domain Verification**: https://resend.com/docs/dashboard/domains/introduction
- **API Reference**: https://resend.com/docs/api-reference/introduction

### **DNS Tools**
- **DNS Checker**: https://dnschecker.org/
- **MXToolbox**: https://mxtoolbox.com/
- **What's My DNS**: https://whatsmydns.net/

### **Email Deliverability**
- **Email Spam Checker**: https://www.mail-tester.com/
- **Sender Score**: https://www.senderscore.org/
- **Google Postmaster**: https://postmaster.google.com/

---

## ✅ **Current Status Summary**

### **Completed Steps**
✅ Step 1: API Key Configuration  
⏳ Step 2: Domain Selection (Choose A or B)  
⏳ Step 3: Add Domain to Resend  
⏳ Step 4: View DNS Records  
⏳ Step 5: Add DNS Records to Provider  
⏳ Step 6: Verify DNS Records  
⏳ Step 7: Update EMAIL_FROM  
⏳ Step 8: Test Email Sending  
⏳ Step 9: Monitor Delivery  
⏳ Step 10: Production Checklist  

### **Next Action Required**
🎯 **Choose your domain** (Option A or Option B) and proceed to Step 3

---

## 📞 **Support**

### **Resend Support**
- **Email**: support@resend.com
- **Documentation**: https://resend.com/docs
- **Status Page**: https://status.resend.com/

### **Genesis Provenance Email Setup**
- All email templates are in `lib/email.ts`
- API routes are in `app/api/team/invite/route.ts`
- Frontend is in `app/(dashboard)/team/page.tsx`

---

**🎉 Once all steps are complete, your team invitation system will be fully functional in production!**
