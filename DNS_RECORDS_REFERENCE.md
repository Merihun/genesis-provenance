# Genesis Provenance DNS Records Reference Card

**Domain:** genesisprovenance.com  
**Registrar:** GoDaddy  
**Last Updated:** November 29, 2025

---

## Quick Reference: All DNS Records Needed

### Vercel (Website Hosting)

| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| A | @ | `76.76.21.21` | 600 | Root domain |
| CNAME | www | `cname.vercel-dns.com` | 600 | WWW subdomain |
| CNAME | app | `cname.vercel-dns.com` | 600 | App subdomain |

**Note:** Get actual Vercel IP from your Vercel Dashboard → Settings → Domains

---

### Microsoft 365 (Email)

#### Verification
| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| TXT | @ | `MS=ms12345678` | 3600 | Domain verification |

**Note:** Get actual MS value from Microsoft 365 Admin Center

#### MX (Mail Exchange)
| Type | Name | Value | Priority | TTL | Purpose |
|------|------|-------|----------|-----|---------|
| MX | @ | `genesisprovenance-com.mail.protection.outlook.com` | 0 | 3600 | Email routing |

#### SPF (Sender Policy Framework)
| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| TXT | @ | `v=spf1 include:spf.protection.outlook.com -all` | 3600 | Email authentication |

#### DKIM (DomainKeys Identified Mail)
| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| CNAME | selector1._domainkey | `selector1-genesisprovenance-com._domainkey.[tenant].onmicrosoft.com` | 3600 | Email signing |
| CNAME | selector2._domainkey | `selector2-genesisprovenance-com._domainkey.[tenant].onmicrosoft.com` | 3600 | Email signing |

**Note:** Get actual values from Microsoft 365 Admin Center → Domains

#### DMARC (Domain-based Message Authentication)
| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| TXT | _dmarc | `v=DMARC1; p=quarantine; rua=mailto:dmarc@genesisprovenance.com` | 3600 | Email policy |

#### Autodiscover (Optional)
| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| CNAME | autodiscover | `autodiscover.outlook.com` | 3600 | Email client config |

---

## Complete DNS Configuration in GoDaddy

### Step-by-Step:

1. Log into GoDaddy: https://dcc.godaddy.com/manage/genesisprovenance.com/dns
2. Delete any conflicting records (old A records, parking pages)
3. Add each record above using the "Add" button
4. Verify with:
   - DNS Checker: https://dnschecker.org
   - MX Toolbox: https://mxtoolbox.com/domain/genesisprovenance.com
5. Wait 10-60 minutes for propagation

---

## Verification Commands

### Check DNS Propagation
```bash
# Check A record
dig genesisprovenance.com A

# Check CNAME records
dig www.genesisprovenance.com CNAME
dig app.genesisprovenance.com CNAME

# Check MX records
dig genesisprovenance.com MX

# Check TXT records (SPF, DMARC)
dig genesisprovenance.com TXT
dig _dmarc.genesisprovenance.com TXT
```

### Online Tools
- **DNS Propagation:** https://dnschecker.org
- **MX Records:** https://mxtoolbox.com
- **Email Health:** https://mxtoolbox.com/domain/genesisprovenance.com
- **SPF/DKIM Check:** https://www.mail-tester.com

---

## Expected Final Configuration

Once all records are added and propagated:

### Domains Should Load:
- ✅ https://genesisprovenance.com → Vercel app
- ✅ https://www.genesisprovenance.com → Redirects to main
- ✅ https://app.genesisprovenance.com → Vercel app (if configured)
- ✅ All with green padlock (SSL)

### Email Should Work:
- ✅ Send from: admin@genesisprovenance.com
- ✅ Receive at: info@genesisprovenance.com
- ✅ SPF: PASS
- ✅ DKIM: PASS
- ✅ DMARC: PASS

---

## Troubleshooting

### Issue: Domain doesn't load
- Check A record points to correct Vercel IP
- Verify CNAME records are correct
- Wait 30-60 minutes for propagation
- Clear browser cache

### Issue: SSL certificate error
- Wait 15-30 minutes after DNS propagation
- In Vercel Dashboard → Domains → Click "Refresh"
- Clear browser cache

### Issue: Email not working
- Verify all MX records are correct
- Check SPF/DKIM records at https://mxtoolbox.com
- Wait 24 hours for full email propagation
- Verify email account is active in Microsoft 365

### Issue: WWW not redirecting
- Verify CNAME for www points to cname.vercel-dns.com
- In Vercel Dashboard → Domains → Set www to redirect to root
- Wait for DNS propagation

---

## Important Notes

1. **TTL (Time To Live):**
   - 600 = 10 minutes (good for testing)
   - 3600 = 1 hour (standard)
   - Change to 86400 (24 hours) after everything works

2. **Priority (MX Records):**
   - Lower number = higher priority
   - Microsoft 365 typically uses 0

3. **DNS Propagation:**
   - Can take 5 minutes to 48 hours
   - Usually 15-30 minutes for most locations
   - Test from multiple locations: https://dnschecker.org

4. **SSL Certificates:**
   - Vercel auto-provisions Let's Encrypt certificates
   - Usually takes 5-15 minutes after DNS propagates
   - Click "Refresh" in Vercel if it takes longer

---

## Print This Card

Keep this reference handy during deployment. Check off each record as you add it:

### Vercel Records:
- [ ] A record (@)
- [ ] CNAME (www)
- [ ] CNAME (app)

### Email Records:
- [ ] TXT (MS verification)
- [ ] MX record
- [ ] TXT (SPF)
- [ ] CNAME (DKIM selector1)
- [ ] CNAME (DKIM selector2)
- [ ] TXT (DMARC)
- [ ] CNAME (autodiscover)

---

**Last Updated:** November 29, 2025  
**Status:** Reference Card v1.0
