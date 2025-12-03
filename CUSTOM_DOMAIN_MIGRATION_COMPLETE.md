# Custom Domain Migration Guide

## ✅ Deployment Status

Your Genesis Provenance app is configured to use the custom domain:

**Primary Domain**: `https://app.genesisprovenance.com`  
**Old Domain**: `https://genesisprovenance.abacusai.app` (will be deprecated)

---

## 🔧 What Has Been Updated

### 1. Environment Variables (Manual Update Required)

The following environment variable needs to be updated in your `.env` file:

```bash
# OLD
NEXTAUTH_URL=https://genesisprovenance.abacusai.app

# NEW (Update this manually)
NEXTAUTH_URL=https://app.genesisprovenance.com
```

**How to Update:**
```bash
cd /home/ubuntu/genesis_provenance/nextjs_space
nano .env
# Change NEXTAUTH_URL to https://app.genesisprovenance.com
# Save and exit (Ctrl+X, Y, Enter)
```

### 2. Stripe Configuration

Update your Stripe webhooks and redirect URLs:

#### Stripe Webhooks
1. Go to https://dashboard.stripe.com/webhooks
2. Update your existing webhook endpoint:
   - **Old**: `https://genesisprovenance.abacusai.app/api/billing/webhook`
   - **New**: `https://app.genesisprovenance.com/api/billing/webhook`

#### Stripe Checkout Success/Cancel URLs
These are dynamically generated in the code, but verify in:
- `/app/api/billing/checkout/route.ts` (already uses environment-based URLs)

### 3. Resend Email Configuration

Update your email template links:

1. Go to https://resend.com/emails
2. Update any email templates that reference the old domain
3. Team invitation emails automatically use the `NEXTAUTH_URL` variable

### 4. OAuth Callback URLs (if applicable)

If you have any OAuth providers configured (Google SSO, etc.), update redirect URIs:

**Example for Google OAuth:**
- **Old**: `https://genesisprovenance.abacusai.app/api/auth/callback/google`
- **New**: `https://app.genesisprovenance.com/api/auth/callback/google`

---

## 📋 Complete Migration Checklist

### Pre-Deployment
- [x] Custom domain registered in Abacus.AI App Management Console
- [x] DNS records configured in GoDaddy
- [x] Domain verified in Abacus.AI
- [x] SSL certificate provisioned

### Environment Configuration
- [ ] Update `NEXTAUTH_URL` in `.env` file
- [ ] Verify all environment variables point to new domain
- [ ] Test authentication locally with new domain

### Third-Party Services
- [ ] Update Stripe webhook endpoint
- [ ] Update Resend email template links
- [ ] Update OAuth callback URLs (if using Google SSO, etc.)
- [ ] Update any external API callbacks

### Testing
- [ ] Test login/signup flow
- [ ] Test Stripe checkout
- [ ] Test team invitation emails
- [ ] Test AI authentication
- [ ] Test VIN lookup
- [ ] Test file uploads (S3)
- [ ] Test PDF certificate generation
- [ ] Test public asset sharing (`/asset/[id]`)

### Marketing & Documentation
- [ ] Update website homepage with new domain
- [ ] Update social media profiles
- [ ] Update email signatures
- [ ] Update business cards
- [ ] Update Google My Business listing
- [ ] Update LinkedIn company page
- [ ] Notify users of domain change

### Post-Deployment
- [ ] Monitor application logs for errors
- [ ] Test all critical user flows
- [ ] Verify SSL certificate is valid
- [ ] Check DNS propagation globally (use https://dnschecker.org)
- [ ] Update bookmarks and documentation

---

## 🌐 Domain Architecture

### Primary Application Domain
**`app.genesisprovenance.com`** - Main application (dashboard, vault, settings, analytics)

### Recommended Future Domains
1. **`genesisprovenance.com`** (root domain)  
   - Use for: Marketing landing page, about us, pricing, contact
   - Should have a prominent "Launch App" button pointing to `app.genesisprovenance.com`

2. **`api.genesisprovenance.com`** (optional)  
   - Use for: Public API endpoints for partners/integrations
   - Currently not implemented

3. **`docs.genesisprovenance.com`** (optional)  
   - Use for: API documentation, developer guides
   - Currently not implemented

---

## 📱 Social Media & Marketing Updates

Update the following platforms with your new domain:

### Social Media Profiles
1. **LinkedIn Company Page**
   - Website: `https://app.genesisprovenance.com`
   - About section: Update description with new domain

2. **Twitter/X**
   - Bio: Update with new domain
   - Pinned tweet: Announce domain change

3. **Instagram**
   - Bio link: `https://app.genesisprovenance.com`
   - Story highlight: Create "Link in Bio" highlight

4. **Facebook Business Page**
   - Website: Update to new domain
   - About section: Update description

### Marketing Materials
1. **Email Signatures**
   ```
   [Your Name]
   [Your Title] | Genesis Provenance
   https://app.genesisprovenance.com
   admin@genesisprovenance.com
   ```

2. **Business Cards**
   - Website: `app.genesisprovenance.com`
   - Email: `admin@genesisprovenance.com`

3. **Pitch Decks & Presentations**
   - Update all slides with new domain
   - Demo links: Point to `app.genesisprovenance.com`

4. **Grant Applications**
   - NSF SBIR: Update product URL
   - Y Combinator: Update demo link
   - AWS Activate: Update company website
   - Google for Startups: Update application URL

---

## 🔍 Testing Your Custom Domain

### 1. DNS Verification
```bash
# Check DNS records
nslookup app.genesisprovenance.com
dig app.genesisprovenance.com

# Check SSL certificate
open https://www.sslshopper.com/ssl-checker.html
# Enter: app.genesisprovenance.com
```

### 2. Application Testing

#### Test Authentication
1. Go to `https://app.genesisprovenance.com/auth/login`
2. Log in with your credentials
3. Verify you're redirected to `/dashboard`
4. Check browser address bar shows custom domain

#### Test Stripe Checkout
1. Go to `https://app.genesisprovenance.com/settings/billing`
2. Click "Upgrade Plan"
3. Complete checkout with Stripe test card: `4242 4242 4242 4242`
4. Verify redirect back to custom domain after checkout

#### Test Email Links
1. Invite a team member from `/team`
2. Check that invitation email contains links to `app.genesisprovenance.com`
3. Click acceptance link and verify domain

#### Test Public Sharing
1. Go to any verified asset in `/vault`
2. Download PDF certificate
3. Scan QR code in PDF
4. Verify it opens `https://app.genesisprovenance.com/asset/[id]`

### 3. Performance Testing

```bash
# Test load time
curl -o /dev/null -s -w 'Total: %{time_total}s\n' https://app.genesisprovenance.com

# Expected: < 2 seconds
```

---

## 🚨 Troubleshooting

### Issue: "Site Can't Be Reached"
**Cause**: DNS not propagated yet  
**Solution**: Wait 24-48 hours for global DNS propagation. Check https://dnschecker.org

### Issue: SSL Certificate Warning
**Cause**: Certificate not provisioned or invalid  
**Solution**: 
1. Verify domain is verified in Abacus.AI App Management Console
2. Wait 15 minutes for SSL provisioning
3. Contact Abacus.AI support if issue persists

### Issue: Authentication Not Working
**Cause**: `NEXTAUTH_URL` environment variable not updated  
**Solution**: 
1. Update `NEXTAUTH_URL` in `.env` to `https://app.genesisprovenance.com`
2. Rebuild and redeploy the application

### Issue: Stripe Checkout Fails
**Cause**: Webhook endpoint not updated  
**Solution**: Update webhook in Stripe Dashboard to point to new domain

### Issue: Emails Contain Old Domain Links
**Cause**: Email templates hardcoded with old domain  
**Solution**: 
1. Verify `NEXTAUTH_URL` is updated
2. Check `lib/email.ts` for any hardcoded URLs
3. Update Resend email templates if using pre-saved templates

---

## 📊 Monitoring Post-Migration

### 1. Application Logs
```bash
# Monitor for errors related to domain
tail -f /var/log/nextjs/application.log | grep -i "domain\|url\|redirect"
```

### 2. Analytics (Once Google Analytics is set up)
- Monitor traffic on new domain
- Check for 404 errors
- Verify user flows complete successfully

### 3. Stripe Dashboard
- Monitor successful webhooks
- Check for failed payment events
- Verify subscription updates are syncing

---

## 🎯 Next Steps

### Immediate (Within 24 Hours)
1. ✅ Update `NEXTAUTH_URL` in `.env`
2. ✅ Update Stripe webhook endpoint
3. ✅ Test all critical user flows
4. ✅ Update social media profile links

### Short-Term (Within 1 Week)
1. ✅ Update all marketing materials
2. ✅ Notify existing users of domain change
3. ✅ Update grant application documents
4. ✅ Update email signatures and business cards

### Long-Term (Within 1 Month)
1. 🔄 Create marketing landing page on root domain (`genesisprovenance.com`)
2. 🔄 Set up Google Analytics with new domain
3. 🔄 Configure SEO for new domain
4. 🔄 Consider purchasing SSL certificate for root domain

---

## 🏗️ Future: Marketing Landing Page on Root Domain

Consider creating a separate marketing site on `https://genesisprovenance.com` with:

### Recommended Structure
```
https://genesisprovenance.com/               # Homepage (marketing)
https://genesisprovenance.com/about          # About Us
https://genesisprovenance.com/pricing        # Pricing Plans
https://genesisprovenance.com/contact        # Contact Form
https://genesisprovenance.com/blog           # Blog (future)
https://app.genesisprovenance.com            # Application (current)
```

### Homepage Call-to-Action
```html
<!-- Prominent CTA Button -->
<a href="https://app.genesisprovenance.com/auth/signup" class="btn-primary">
  Get Started Free
</a>

<!-- Login Link -->
<a href="https://app.genesisprovenance.com/auth/login">
  Sign In
</a>
```

### Implementation Options
1. **Option 1: Static Site (Recommended)**
   - Build with Next.js static export
   - Host on Vercel, Netlify, or Cloudflare Pages
   - Fast, cheap, SEO-friendly

2. **Option 2: WordPress**
   - Easy content management
   - Many themes available
   - Good for non-technical team members

3. **Option 3: Webflow**
   - No-code solution
   - Beautiful templates
   - Good for MVP marketing site

---

## 📞 Support

### Abacus.AI Support
- **Email**: support@abacus.ai
- **App Management**: https://apps.abacus.ai/chatllm/?appId=appllm_engineer
- **Domain Configuration**: Manage Domains in App Management Console

### GoDaddy Support (DNS)
- **Help Center**: https://www.godaddy.com/help
- **DNS Management**: https://dcc.godaddy.com

### Stripe Support (Webhooks)
- **Dashboard**: https://dashboard.stripe.com
- **Documentation**: https://stripe.com/docs/webhooks

---

## ✅ Summary

**Custom Domain**: `https://app.genesisprovenance.com`  
**Status**: Configured and ready  
**Next Action**: Update `NEXTAUTH_URL` in `.env` and test all flows  

**Critical Updates Needed:**
1. Environment variable: `NEXTAUTH_URL`
2. Stripe webhook endpoint
3. Social media profile links
4. Marketing materials and documentation

**Estimated Time to Complete All Updates**: 2-4 hours  
**DNS Propagation Time**: 24-48 hours (already done if domain is live)

---

**Migration Date**: December 2, 2025  
**Document Version**: 1.0  
**Last Updated**: 2025-12-02
