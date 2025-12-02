# NEXTAUTH_URL Environment Variable Update Guide

## Overview

This guide provides detailed, step-by-step instructions for updating the `NEXTAUTH_URL` environment variable from the old `.abacusai.app` domain to your new custom domain `app.genesisprovenance.com`.

**What is NEXTAUTH_URL?**  
This environment variable tells NextAuth.js (the authentication library) where your app is hosted. It's critical for:
- Login/logout redirects
- OAuth callback URLs
- Session cookie domain
- Authentication security

**Why update it?**  
Your app is now deployed at `https://app.genesisprovenance.com`, so NextAuth needs to know about the new domain to work correctly.

---

## 🎯 Quick Summary

**What to change:**
```bash
# OLD (current)
NEXTAUTH_URL=https://genesisprovenance.abacusai.app

# NEW (required)
NEXTAUTH_URL=https://app.genesisprovenance.com
```

**Where:** `/home/ubuntu/genesis_provenance/nextjs_space/.env`

**Time required:** 5-10 minutes

---

## 📋 Step-by-Step Instructions

### Method 1: Using nano (Text Editor) - **RECOMMENDED**

This is the easiest method for beginners.

#### Step 1: Navigate to the project directory

```bash
cd /home/ubuntu/genesis_provenance/nextjs_space
```

**Expected output:**
```
# Your terminal prompt changes to show the directory
# Example: ubuntu@server:~/genesis_provenance/nextjs_space$
```

---

#### Step 2: Open the .env file in nano

```bash
nano .env
```

**What you'll see:**
- A text editor opens showing your environment variables
- You'll see multiple lines like `DATABASE_URL=...`, `STRIPE_SECRET_KEY=...`, etc.

---

#### Step 3: Find the NEXTAUTH_URL line

1. **Look for this line:**
   ```bash
   NEXTAUTH_URL=https://genesisprovenance.abacusai.app
   ```

2. **Navigate to it:**
   - Use **Arrow Keys** (↑↓) to move up/down
   - You can also use **Ctrl+W** to search:
     - Press `Ctrl+W`
     - Type: `NEXTAUTH_URL`
     - Press `Enter`
     - nano will jump to that line

---

#### Step 4: Edit the value

1. **Position your cursor:**
   - Move to the line with `NEXTAUTH_URL`
   - Use **Right Arrow** (→) to move to the part you need to change

2. **Delete the old domain:**
   - Position cursor after `https://`
   - Press `Ctrl+K` to delete everything after cursor on that line

3. **Type the new domain:**
   ```bash
   NEXTAUTH_URL=https://app.genesisprovenance.com
   ```

**Final result should look like:**
```bash
NEXTAUTH_URL=https://app.genesisprovenance.com
```

---

#### Step 5: Save and exit nano

1. **Save the file:**
   - Press `Ctrl+O` (Write Out)
   - nano will ask: "File Name to Write: .env"
   - Press `Enter` to confirm
   - You'll see: "[ Wrote XX lines ]" at the bottom

2. **Exit nano:**
   - Press `Ctrl+X`
   - You'll return to your terminal prompt

**Success!** The file is now saved with your changes.

---

### Method 2: Using sed (Command Line) - **ADVANCED**

For users comfortable with command-line tools.

```bash
cd /home/ubuntu/genesis_provenance/nextjs_space
sed -i 's|NEXTAUTH_URL=https://genesisprovenance.abacusai.app|NEXTAUTH_URL=https://app.genesisprovenance.com|g' .env
```

**Explanation:**
- `sed -i`: Edit file in-place
- `'s|OLD|NEW|g'`: Search and replace (globally)
- `.env`: Target file

**Verify the change:**
```bash
cat .env | grep NEXTAUTH_URL
```

**Expected output:**
```
NEXTAUTH_URL=https://app.genesisprovenance.com
```

---

### Method 3: Manual Edit with vim - **EXPERT**

For vim users:

```bash
cd /home/ubuntu/genesis_provenance/nextjs_space
vim .env
```

1. Press `/` to search
2. Type `NEXTAUTH_URL` and press `Enter`
3. Press `i` to enter insert mode
4. Edit the line to: `NEXTAUTH_URL=https://app.genesisprovenance.com`
5. Press `Esc` to exit insert mode
6. Type `:wq` and press `Enter` to save and quit

---

## ✅ Step 6: Verify Your Changes

### Check the file contents

```bash
cd /home/ubuntu/genesis_provenance/nextjs_space
cat .env | grep NEXTAUTH_URL
```

**Expected output:**
```
NEXTAUTH_URL=https://app.genesisprovenance.com
```

✅ **If you see this, you're done!**

❌ **If you see the old domain or an error:**
- Go back to Step 2 and try again
- Make sure you saved the file (Ctrl+O in nano)
- Check for typos in the new URL

---

## 🔄 Step 7: Rebuild and Deploy (If Local Development)

**⚠️ IMPORTANT:** Changes to `.env` require a rebuild for the app to use the new value.

### For Local Development:

```bash
cd /home/ubuntu/genesis_provenance/nextjs_space
yarn build
```

**Wait for build to complete** (about 2-5 minutes)

**Expected output:**
```
✓ Compiled successfully
✓ Generating static pages (24/24)
```

---

### For Production Deployment:

If your app is deployed on Abacus.AI platform:

1. **The platform will automatically use the updated `.env` file**
2. **No manual rebuild needed** - the deployment system reads `.env` on each deployment
3. **Next deployment will use the new value**

To trigger a deployment:
```bash
# This will be done via the deployment tools you're already using
# The .env file is already updated and will be used automatically
```

---

## 🧪 Step 8: Test Authentication

### Test 1: Login

1. **Open your browser**
2. **Navigate to:** `https://app.genesisprovenance.com/auth/login`
3. **Enter credentials:**
   - Email: `john@doe.com`
   - Password: `password123`
4. **Click "Sign In"**

**Expected result:**
- ✅ Login succeeds
- ✅ Redirected to `/dashboard`
- ✅ URL bar shows: `https://app.genesisprovenance.com/dashboard`
- ✅ No errors in browser console

**If login fails:**
- Check browser console for errors (F12 → Console tab)
- Verify you updated `NEXTAUTH_URL` correctly
- Try clearing cookies and trying again

---

### Test 2: Logout

1. **While logged in, click your profile menu** (top-right)
2. **Click "Sign Out"**

**Expected result:**
- ✅ Successfully logged out
- ✅ Redirected to `/auth/login`
- ✅ URL bar shows: `https://app.genesisprovenance.com/auth/login`

---

### Test 3: Session Persistence

1. **Log in again**
2. **Close the browser tab**
3. **Open a new tab**
4. **Navigate to:** `https://app.genesisprovenance.com/dashboard`

**Expected result:**
- ✅ You remain logged in
- ✅ Dashboard loads without requiring login

---

### Test 4: Protected Routes

1. **While logged OUT, try to access:**
   ```
   https://app.genesisprovenance.com/dashboard
   https://app.genesisprovenance.com/vault
   https://app.genesisprovenance.com/settings
   ```

**Expected result:**
- ✅ Automatically redirected to `/auth/login`
- ✅ After login, redirected back to the original page you tried to access

---

## 🚨 Troubleshooting

### Issue 1: "File .env not found"

**Cause:** You're in the wrong directory

**Solution:**
```bash
# Navigate to the correct directory
cd /home/ubuntu/genesis_provenance/nextjs_space

# Verify you're in the right place
ls -la .env
```

**Expected output:**
```
-rw-r--r-- 1 ubuntu ubuntu 1234 Dec  2 12:00 .env
```

---

### Issue 2: Login redirects to old domain

**Cause:** Browser cached old authentication cookies

**Solution:**
1. **Clear browser cookies:**
   - Press `F12` to open DevTools
   - Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
   - Click "Cookies"
   - Delete all cookies for `app.genesisprovenance.com` and `genesisprovenance.abacusai.app`
2. **Close and reopen browser**
3. **Try logging in again**

---

### Issue 3: "Invalid session" or "Authentication failed"

**Cause:** NextAuth is still using old `NEXTAUTH_URL` value

**Solution:**
1. **Verify `.env` file was updated:**
   ```bash
   cat /home/ubuntu/genesis_provenance/nextjs_space/.env | grep NEXTAUTH_URL
   ```
   Should show: `NEXTAUTH_URL=https://app.genesisprovenance.com`

2. **Rebuild the application:**
   ```bash
   cd /home/ubuntu/genesis_provenance/nextjs_space
   yarn build
   ```

3. **Restart the application** (if running locally):
   ```bash
   # Stop current process (Ctrl+C)
   yarn start
   ```

---

### Issue 4: Changes not taking effect

**Cause:** Old build cache or environment not reloaded

**Solution:**
```bash
cd /home/ubuntu/genesis_provenance/nextjs_space

# Clear Next.js cache
rm -rf .next

# Rebuild
yarn build

# Restart (if local)
yarn start
```

---

### Issue 5: "nano: command not found"

**Cause:** nano text editor not installed

**Solution:** Use an alternative method:

**Option A: Install nano**
```bash
sudo apt-get update
sudo apt-get install nano -y
```

**Option B: Use vi instead**
```bash
vi /home/ubuntu/genesis_provenance/nextjs_space/.env
# Press 'i' to insert
# Edit the line
# Press Esc, then ':wq' to save
```

**Option C: Use echo**
```bash
# Backup first
cp .env .env.backup

# Use sed to replace
sed -i 's|NEXTAUTH_URL=https://genesisprovenance.abacusai.app|NEXTAUTH_URL=https://app.genesisprovenance.com|g' .env
```

---

## 📊 Before vs After Comparison

### Before Update
```bash
# Login URL
https://genesisprovenance.abacusai.app/api/auth/signin

# Callback URL
https://genesisprovenance.abacusai.app/api/auth/callback

# Cookie Domain
.abacusai.app
```

### After Update
```bash
# Login URL
https://app.genesisprovenance.com/api/auth/signin

# Callback URL
https://app.genesisprovenance.com/api/auth/callback

# Cookie Domain
.genesisprovenance.com
```

---

## ✅ Success Criteria Checklist

Confirm all items before considering the update complete:

**File Update:**
- [ ] `.env` file opened successfully
- [ ] `NEXTAUTH_URL` line found
- [ ] Value changed to `https://app.genesisprovenance.com`
- [ ] File saved successfully
- [ ] Changes verified with `cat .env | grep NEXTAUTH_URL`

**Application:**
- [ ] Application rebuilt (if local development)
- [ ] No build errors
- [ ] Application restarted/redeployed

**Authentication Tests:**
- [ ] Login works at `https://app.genesisprovenance.com/auth/login`
- [ ] Logout works correctly
- [ ] Session persists across browser tabs
- [ ] Protected routes redirect to login
- [ ] After login, redirects back to intended page
- [ ] No authentication errors in console

---

## 🔐 Security Notes

### What NEXTAUTH_URL Controls

1. **Redirect URIs:**
   - Where users are sent after login/logout
   - Must match your actual domain for security

2. **Callback URLs:**
   - Where OAuth providers send users after authorization
   - Critical for Google SSO, OAuth integrations

3. **Cookie Domain:**
   - Which domain can read authentication cookies
   - Prevents session hijacking across domains

4. **CSRF Protection:**
   - Used to generate and validate CSRF tokens
   - Protects against cross-site request forgery

### Why Incorrect NEXTAUTH_URL is a Security Risk

❌ **If left pointing to old domain:**
- Users might be redirected to old domain after login
- Session cookies might not work properly
- OAuth providers might reject callbacks
- CSRF validation might fail

✅ **After updating to correct domain:**
- All redirects go to correct domain
- Session management works properly
- OAuth integrations work correctly
- CSRF protection functions as expected

---

## 📚 Additional Resources

### NextAuth.js Documentation
- Environment Variables: https://next-auth.js.org/configuration/options#environment-variables
- Deployment: https://next-auth.js.org/deployment

### Related Genesis Provenance Docs
- `CUSTOM_DOMAIN_MIGRATION_COMPLETE.md` - Complete migration guide
- `DOMAIN_UPDATE_CHECKLIST.txt` - Quick checklist for all domain updates
- `CHECKOUT_TROUBLESHOOTING.md` - Stripe integration with new domain

---

## 🆘 Still Having Issues?

### Check Server Logs
```bash
# View application logs
tail -f /var/log/nextjs/application.log

# Search for authentication errors
grep -i "auth" /var/log/nextjs/application.log | tail -20
```

### Verify Environment Variables at Runtime
Add temporary logging to check if env var is loaded:

1. Open `/home/ubuntu/genesis_provenance/nextjs_space/lib/auth-options.ts`
2. Add at the top:
   ```typescript
   console.log('[Auth] NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
   ```
3. Rebuild and check logs
4. You should see: `[Auth] NEXTAUTH_URL: https://app.genesisprovenance.com`

---

## ✨ Summary

**What you did:**
1. ✅ Opened `.env` file in nano
2. ✅ Changed `NEXTAUTH_URL` from old domain to `https://app.genesisprovenance.com`
3. ✅ Saved the file
4. ✅ Verified the change
5. ✅ Rebuilt/redeployed application (if needed)
6. ✅ Tested authentication

**Result:**
- Your app now uses the correct custom domain for authentication
- All login/logout flows work properly
- Sessions are correctly scoped to your domain
- OAuth integrations will use correct callback URLs

**Next Steps:**
1. Test all authentication flows thoroughly
2. Update Stripe webhook URLs (see `STRIPE_WEBHOOK_EVENTS_GUIDE.md`)
3. Update any OAuth provider redirect URIs (Google SSO, etc.)
4. Notify users of domain change
5. Update marketing materials and documentation

---

**Last Updated:** December 2, 2025  
**App Version:** Phase 7A  
**Auth Library:** NextAuth.js v4  
**Current Domain:** app.genesisprovenance.com
