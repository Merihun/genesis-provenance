# 🎯 Stripe Price IDs Collection Helper

**Current Status:** Ready to create products

---

## Quick Setup Checklist

### Before You Start
- [ ] Signed in to Stripe Dashboard
- [ ] Switched to **Test Mode** (toggle in top-right)
- [ ] On Products page: https://dashboard.stripe.com/test/products

---

## Product 1: Genesis Provenance - Collector

### Product Details
- **Name:** `Genesis Provenance - Collector`
- **Description:** `Perfect for individual collectors managing personal luxury assets. Includes 50 assets, 1 team member, 25 AI analyses/month, 5GB storage, and 10 VIN lookups/month.`

### Monthly Price
- **Amount:** `$29.00`
- **Billing:** `Monthly`
- **Description:** `Collector Plan - Monthly`
- **Price ID:** `_____________________________` ← COPY HERE

### Annual Price
- **Amount:** `$290.00`
- **Billing:** `Yearly`
- **Description:** `Collector Plan - Annual (Save $58)`
- **Price ID:** `_____________________________` ← COPY HERE

---

## Product 2: Genesis Provenance - Dealer

### Product Details
- **Name:** `Genesis Provenance - Dealer`
- **Description:** `For dealers and boutiques managing inventory. Includes 500 assets, 5 team members, 250 AI analyses/month, 50GB storage, 100 VIN lookups/month, and advanced analytics.`

### Monthly Price
- **Amount:** `$99.00`
- **Billing:** `Monthly`
- **Description:** `Dealer Plan - Monthly`
- **Price ID:** `_____________________________` ← COPY HERE

### Annual Price
- **Amount:** `$990.00`
- **Billing:** `Yearly`
- **Description:** `Dealer Plan - Annual (Save $198)`
- **Price ID:** `_____________________________` ← COPY HERE

---

## Product 3: Genesis Provenance - Enterprise

### Product Details
- **Name:** `Genesis Provenance - Enterprise`
- **Description:** `Custom solution for large organizations. Unlimited assets, team members, AI analyses, storage, VIN lookups, plus advanced analytics, priority support, and API access.`

### Monthly Price
- **Amount:** `$399.00`
- **Billing:** `Monthly`
- **Description:** `Enterprise Plan - Monthly`
- **Price ID:** `_____________________________` ← COPY HERE

### Annual Price
- **Amount:** `$3,990.00`
- **Billing:** `Yearly`
- **Description:** `Enterprise Plan - Annual (Save $798)`
- **Price ID:** `_____________________________` ← COPY HERE

---

## 📝 Step-by-Step Instructions

### Creating Each Product

1. Click **"+ Add product"** button
2. Enter the **Product Name** (from above)
3. Enter the **Product Description** (from above)
4. Click **"Add product"**

### Adding Prices to Each Product

1. In the product page, scroll to **"Pricing"** section
2. Click **"+ Add another price"** (or the first price if just created)
3. Enter the **Price Amount** (e.g., `29.00`)
4. Select **Billing Period** (Monthly or Yearly)
5. Enter **Price Description** (e.g., "Collector Plan - Monthly")
6. Click **"Add price"**
7. **IMMEDIATELY COPY THE PRICE ID** (starts with `price_...`)
8. Paste it into the corresponding field in this document
9. Repeat for the second price (monthly/annual)

### Finding Price IDs Later

1. Go to the Product page
2. Under "Pricing" section, click on the price
3. The Price ID is displayed at the top: `price_xxxxxxxxxxxxx`
4. Click the copy icon next to it

---

## ✅ Verification Checklist

Before proceeding, make sure you have:

- [ ] **6 Price IDs total** (2 for each product)
- [ ] All Price IDs start with `price_`
- [ ] All Price IDs are from **Test Mode**
- [ ] Monthly and Annual prices are correctly paired

---

## 🚀 Next Step

Once you have all 6 Price IDs filled in above, let me know and I'll:
1. Automatically add them to your `.env` file
2. Test the configuration
3. Confirm everything is working

**Just reply with:** "I have the Price IDs" and I'll handle the rest!

---

## 🆘 Troubleshooting

### Can't find Price ID?
- Go to the product page in Stripe Dashboard
- Click on the price under "Pricing" section
- The Price ID is at the top of the price detail page

### Need to change pricing?
- You can't edit existing prices
- Create a new price with the correct amount
- Update the Price ID in `.env` (I'll help with this)

### Accidentally created in Live Mode?
- Switch to Test Mode (toggle in top-right)
- Create the products/prices again in Test Mode
- Use the Test Mode Price IDs

---

**Happy Creating! 🎉**
