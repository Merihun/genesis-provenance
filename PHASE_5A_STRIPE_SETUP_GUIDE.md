# Phase 5A: Stripe Products & Prices Setup Guide

## ✅ Completed Steps

1. **Environment Variables Configured**
   - `STRIPE_PUBLISHABLE_KEY` ✓
   - `STRIPE_SECRET_KEY` ✓
   - `STRIPE_WEBHOOK_SECRET` (placeholder for Phase 5B)

2. **Database Schema Updated**
   - Enhanced `Subscription` model with Stripe fields
   - Added `UsageLog` model for feature tracking

3. **Core Utilities Created**
   - `/lib/stripe.ts` - Stripe client and helper functions
   - `/lib/feature-gates.ts` - Feature access and usage tracking

4. **Billing UI Created**
   - `/app/(dashboard)/settings/billing/page.tsx` - Billing dashboard
   - `/api/billing/usage/route.ts` - Usage API
   - `/api/billing/subscription/route.ts` - Subscription API

---

## 📋 Next Step: Create Stripe Products & Prices

You need to create products and prices in your Stripe Dashboard. Follow these steps:

### Step 1: Access Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/products
2. Make sure you're in **Test mode** (toggle in top-right corner)

### Step 2: Create Collector Plan

**Create Product:**
1. Click "+ Add product"
2. **Name**: `Genesis Provenance - Collector`
3. **Description**: `Perfect for individual collectors managing personal luxury assets. Includes 50 assets, 1 team member, 25 AI analyses/month, 5GB storage, and 10 VIN lookups/month.`
4. Click "Add product"

**Add Monthly Price:**
1. In the product page, scroll to "Pricing"
2. Click "+ Add another price"
3. **Price**: `$29.00`
4. **Billing period**: `Monthly`
5. **Price description**: `Collector Plan - Monthly`
6. Click "Add price"
7. **COPY THE PRICE ID** (starts with `price_...`)

**Add Annual Price:**
1. Click "+ Add another price"
2. **Price**: `$290.00`
3. **Billing period**: `Yearly`
4. **Price description**: `Collector Plan - Annual (Save $58)`
5. Click "Add price"
6. **COPY THE PRICE ID** (starts with `price_...`)

### Step 3: Create Dealer Plan

**Create Product:**
1. Click "+ Add product"
2. **Name**: `Genesis Provenance - Dealer`
3. **Description**: `For dealers and boutiques managing inventory. Includes 500 assets, 5 team members, 250 AI analyses/month, 50GB storage, 100 VIN lookups/month, and advanced analytics.`
4. Click "Add product"

**Add Monthly Price:**
1. **Price**: `$99.00`
2. **Billing period**: `Monthly`
3. **Price description**: `Dealer Plan - Monthly`
4. **COPY THE PRICE ID**

**Add Annual Price:**
1. **Price**: `$990.00`
2. **Billing period**: `Yearly`
3. **Price description**: `Dealer Plan - Annual (Save $198)`
4. **COPY THE PRICE ID**

### Step 4: Create Enterprise Plan

**Create Product:**
1. Click "+ Add product"
2. **Name**: `Genesis Provenance - Enterprise`
3. **Description**: `Custom solution for large organizations. Unlimited assets, team members, AI analyses, storage, VIN lookups, plus advanced analytics, priority support, and API access.`
4. Click "Add product"

**Add Monthly Price:**
1. **Price**: `$399.00`
2. **Billing period**: `Monthly`
3. **Price description**: `Enterprise Plan - Monthly`
4. **COPY THE PRICE ID**

**Add Annual Price:**
1. **Price**: `$3,990.00`
2. **Billing period**: `Yearly`
3. **Price description**: `Enterprise Plan - Annual (Save $798)`
4. **COPY THE PRICE ID**

---

## 🔑 Step 3: Configure Price IDs in Environment

After creating all products and prices, you'll have **6 Price IDs**. Add them to your `.env` file:

```bash
# Collector Plan
STRIPE_PRICE_COLLECTOR_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_COLLECTOR_ANNUAL=price_xxxxxxxxxxxxx

# Dealer Plan
STRIPE_PRICE_DEALER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_DEALER_ANNUAL=price_xxxxxxxxxxxxx

# Enterprise Plan
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_xxxxxxxxxxxxx
```

**Replace `price_xxxxxxxxxxxxx` with your actual Price IDs from Stripe!**

---

## 📊 Plan Summary

### Collector Plan - $29/month or $290/year
- ✅ 50 Assets
- ✅ 1 Team Member
- ✅ 25 AI Analyses/month
- ✅ 5 GB Storage
- ✅ 10 VIN Lookups/month
- ✅ PDF Certificates
- ❌ Advanced Analytics
- ❌ Priority Support
- ❌ API Access

### Dealer Plan - $99/month or $990/year
- ✅ 500 Assets
- ✅ 5 Team Members
- ✅ 250 AI Analyses/month
- ✅ 50 GB Storage
- ✅ 100 VIN Lookups/month
- ✅ PDF Certificates
- ✅ **Advanced Analytics**
- ❌ Priority Support
- ❌ API Access

### Enterprise Plan - $399/month or $3,990/year
- ✅ **Unlimited** Assets
- ✅ **Unlimited** Team Members
- ✅ **Unlimited** AI Analyses
- ✅ **Unlimited** Storage
- ✅ **Unlimited** VIN Lookups
- ✅ PDF Certificates
- ✅ Advanced Analytics
- ✅ **Priority Support**
- ✅ **API Access**

---

## 🧪 Testing in Stripe Test Mode

### Test Card Numbers
When testing subscriptions, use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiration date, any 3-digit CVC, and any ZIP code.

### Viewing Test Subscriptions
1. Go to https://dashboard.stripe.com/test/subscriptions
2. You'll see all test subscriptions created
3. Click on a subscription to view details, cancel, or update

---

## 🔄 What's Next?

Once you've configured the Price IDs in your `.env` file:

1. **Phase 5A will be complete** ✅
2. You can view the billing page at `/settings/billing`
3. Usage tracking will be functional
4. Feature gates will enforce limits

**Phase 5B will add:**
- Checkout flow for new subscriptions
- Stripe Customer Portal for payment management
- Webhook handler for subscription events
- Upgrade/downgrade functionality

---

## 📝 Important Notes

1. **Test Mode**: Always use test mode for development. Switch to live mode only when ready for production.
2. **Price IDs**: Price IDs are permanent. If you need to change pricing, create new prices.
3. **Webhooks**: Webhook setup will come in Phase 5B.
4. **Customer Portal**: Stripe's hosted portal will handle payment method updates, invoice history, and cancellations.

---

## 🆘 Troubleshooting

### Can't find Price ID?
1. Go to the product page in Stripe Dashboard
2. Under "Pricing" section, click on the price
3. The Price ID is at the top of the page

### Need to change pricing?
1. You can't edit existing prices
2. Create a new price with the correct amount
3. Update the Price ID in your `.env` file
4. The old price will still exist but won't be used

### Want to test trial periods?
1. In Stripe Dashboard, edit a product
2. Under "Pricing", enable "Free trial"
3. Set trial duration (e.g., 14 days)

---

## 🎉 Ready to Continue!

Once you've completed the Stripe setup and added Price IDs to your `.env` file, Phase 5A is complete! The foundation is in place for:

- ✅ Subscription tracking
- ✅ Usage monitoring
- ✅ Feature gating
- ✅ Billing UI

Phase 5B will make it all interactive with actual payment processing! 🚀
