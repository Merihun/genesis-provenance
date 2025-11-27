# DNS & Email Setup Guide

This guide provides instructions for configuring DNS records in GoDaddy and setting up Microsoft 365 email for Genesis Provenance (genesisprovenance.com).

## Table of Contents

1. [DNS Records for GoDaddy](#dns-records-for-godaddy)
2. [Microsoft 365 Email Configuration](#microsoft-365-email-configuration)
3. [SSL/TLS Certificates](#ssltls-certificates)
4. [Verification & Testing](#verification--testing)

---

## DNS Records for GoDaddy

### Overview of Subdomains

Genesis Provenance uses the following subdomain structure:

- **www.genesisprovenance.com** - Marketing website (public)
- **app.genesisprovenance.com** - Application dashboard (authenticated)
- **api.genesisprovenance.com** - API endpoints (Phase 3+)
- **docs.genesisprovenance.com** - Documentation (optional, future)
- **status.genesisprovenance.com** - Status page (optional, future)
- **partners.genesisprovenance.com** - Partner portal (optional, future)

### DNS Records to Configure

Log in to your GoDaddy account and navigate to DNS Management for `genesisprovenance.com`. Add/update the following records:

#### 1. Root Domain (genesisprovenance.com)

```
Type: A
Name: @
Value: <YOUR_SERVER_IP>
TTL: 600 (10 minutes) or default
```

**Or use CNAME if using a hosting platform:**
```
Type: CNAME
Name: @
Value: <your-hosting-platform-url>
TTL: 600
```

#### 2. WWW Subdomain (www.genesisprovenance.com)

```
Type: CNAME
Name: www
Value: genesisprovenance.com
TTL: 600
```

**Or point to hosting platform:**
```
Type: CNAME
Name: www
Value: <your-hosting-platform-url>
TTL: 600
```

#### 3. App Subdomain (app.genesisprovenance.com)

```
Type: CNAME
Name: app
Value: <your-hosting-platform-url>
TTL: 600
```

**Or use A record:**
```
Type: A
Name: app
Value: <YOUR_APP_SERVER_IP>
TTL: 600
```

#### 4. API Subdomain (api.genesisprovenance.com) - Phase 3+

```
Type: CNAME
Name: api
Value: <your-api-hosting-url>
TTL: 600
```

#### 5. Optional Subdomains (Future Phases)

**Documentation:**
```
Type: CNAME
Name: docs
Value: <your-docs-hosting-url>
TTL: 600
```

**Status Page:**
```
Type: CNAME
Name: status
Value: <your-status-page-url>
TTL: 600
```

**Partner Portal:**
```
Type: CNAME
Name: partners
Value: <your-partner-portal-url>
TTL: 600
```

---

## Microsoft 365 Email Configuration

### Prerequisites

- Active Microsoft 365 subscription
- Domain ownership verified in Microsoft 365 Admin Center
- Access to GoDaddy DNS management

### Required DNS Records for Microsoft 365

#### 1. MX Records (Mail Exchange)

These records direct email to Microsoft 365 servers.

```
Type: MX
Name: @ (or leave blank)
Value: <your-domain>.mail.protection.outlook.com
Priority: 0
TTL: 3600
```

**Example:**
```
Type: MX
Name: @
Value: genesisprovenance-com.mail.protection.outlook.com
Priority: 0
TTL: 3600
```

*Note: Get your exact MX record value from Microsoft 365 Admin Center > Domains > DNS records*

#### 2. SPF Record (Sender Policy Framework)

Prevents email spoofing by specifying authorized mail servers.

```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:spf.protection.outlook.com -all
TTL: 3600
```

**If you have existing SPF record**, merge them:
```
v=spf1 include:spf.protection.outlook.com include:other-service.com -all
```

#### 3. DKIM Records (DomainKeys Identified Mail)

Authenticates your emails with a digital signature.

**You'll need two CNAME records from Microsoft 365:**

```
Type: CNAME
Name: selector1._domainkey
Value: selector1-genesisprovenance-com._domainkey.<region>.protection.outlook.com
TTL: 3600
```

```
Type: CNAME
Name: selector2._domainkey
Value: selector2-genesisprovenance-com._domainkey.<region>.protection.outlook.com
TTL: 3600
```

*Note: Get exact values from Microsoft 365 Admin Center*

#### 4. DMARC Record (Domain-based Message Authentication)

Specifies how to handle emails that fail SPF/DKIM checks.

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@genesisprovenance.com
TTL: 3600
```

**Recommended for production:**
```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@genesisprovenance.com; ruf=mailto:dmarc-forensics@genesisprovenance.com; fo=1
```

#### 5. Autodiscover Record (Optional but Recommended)

Helps email clients automatically configure settings.

```
Type: CNAME
Name: autodiscover
Value: autodiscover.outlook.com
TTL: 3600
```

### Getting Your Microsoft 365 DNS Records

1. Log in to **Microsoft 365 Admin Center**: https://admin.microsoft.com
2. Navigate to **Settings** > **Domains**
3. Select **genesisprovenance.com**
4. Click **DNS records**
5. Copy the exact values provided by Microsoft

### Verification

After adding DNS records:

1. Return to Microsoft 365 Admin Center
2. Click **Verify** next to each record type
3. Wait for DNS propagation (can take up to 48 hours, usually much faster)
4. Microsoft will confirm when records are detected

---

## SSL/TLS Certificates

### For Production Deployment

**Option 1: Let's Encrypt (Free)**
- Automatic certificate renewal
- Use Certbot or hosting platform's built-in SSL
- Supports wildcard certificates for all subdomains

**Option 2: Cloudflare (Free + CDN)**
- Free SSL/TLS certificates
- DDoS protection included
- Global CDN for faster load times
- Update DNS to point to Cloudflare nameservers

**Option 3: Paid SSL Certificate**
- Purchase from GoDaddy or other provider
- Extended validation (EV) certificates for enhanced trust
- Wildcard certificates for all subdomains

### Certificate Requirements

- **Root domain**: genesisprovenance.com
- **WWW**: www.genesisprovenance.com
- **App**: app.genesisprovenance.com
- **API**: api.genesisprovenance.com (Phase 3+)

**Recommended**: Use a wildcard certificate (*.genesisprovenance.com) to cover all subdomains.

### SSL Configuration Checklist

- [ ] Certificate installed for root domain
- [ ] Certificate covers all required subdomains
- [ ] HTTPS redirects configured (HTTP → HTTPS)
- [ ] HSTS headers enabled
- [ ] TLS 1.2+ enforced (disable older versions)
- [ ] SSL certificate auto-renewal configured

---

## Verification & Testing

### DNS Propagation Check

Use these tools to verify DNS records are propagating correctly:

- **WhatsMyDNS**: https://www.whatsmydns.net
- **DNS Checker**: https://dnschecker.org
- **MXToolbox**: https://mxtoolbox.com

### Email Configuration Testing

1. **Send Test Email**: Send an email from your Microsoft 365 account to an external address
2. **Check SPF/DKIM**: Use https://www.mail-tester.com
3. **MX Record Verification**: https://mxtoolbox.com/SuperTool.aspx
4. **DMARC Validator**: https://dmarc.org/dmarc-tools/

### SSL Certificate Testing

- **SSL Labs Test**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com

### Common DNS Record Troubleshooting

| Issue | Solution |
|-------|----------|
| DNS not propagating | Wait up to 48 hours; reduce TTL to 600 seconds |
| Email not received | Check MX records with MXToolbox; verify Microsoft 365 setup |
| SSL errors | Ensure certificate covers all subdomains; check HTTPS redirects |
| SPF/DKIM failing | Verify TXT records exactly match Microsoft's values |
| Subdomain not resolving | Check CNAME points to correct target; verify A record IP |

---

## Quick Reference: Full DNS Setup

### A/CNAME Records (Hosting)

```
@            A/CNAME  <server-ip-or-hosting-url>
www          CNAME    genesisprovenance.com or <hosting-url>
app          CNAME    <app-hosting-url>
api          CNAME    <api-hosting-url> (Phase 3+)
```

### Email Records (Microsoft 365)

```
@                     MX      0  <your-domain>.mail.protection.outlook.com
@                     TXT     v=spf1 include:spf.protection.outlook.com -all
selector1._domainkey  CNAME   selector1-<domain>._domainkey.<region>.protection.outlook.com
selector2._domainkey  CNAME   selector2-<domain>._domainkey.<region>.protection.outlook.com
_dmarc                TXT     v=DMARC1; p=quarantine; rua=mailto:dmarc@genesisprovenance.com
autodiscover          CNAME   autodiscover.outlook.com
```

---

## Support

If you encounter issues:

1. **GoDaddy DNS Support**: https://www.godaddy.com/help/dns-management-680
2. **Microsoft 365 Support**: https://admin.microsoft.com/support
3. **Email**: contact@genesisprovenance.com

---

## Notes

- DNS changes can take up to 48 hours to propagate globally
- Start with higher TTL values (3600) and lower them (600) when making changes
- Always backup existing DNS records before making changes
- Test thoroughly in staging environment before updating production DNS
- Keep Microsoft 365 Admin Center open during setup for easy reference to DNS values
