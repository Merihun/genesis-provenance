#!/bin/bash

# Stripe Price IDs Configuration Script
# This script will help you add your Stripe Price IDs to the .env file

echo "🚀 Genesis Provenance - Stripe Price IDs Setup"
echo "="
echo ""
echo "This script will add your Stripe Price IDs to the .env file."
echo "Make sure you have all 6 Price IDs ready!"
echo ""
read -p "Press Enter to continue..."
echo ""

# Function to prompt for Price ID
prompt_price_id() {
    local var_name=$1
    local description=$2
    local price_id
    
    while true; do
        echo ""
        echo "$description"
        read -p "Enter Price ID (starts with 'price_'): " price_id
        
        # Validate Price ID format
        if [[ $price_id =~ ^price_[a-zA-Z0-9_]+$ ]]; then
            echo "  ✓ Valid Price ID: $price_id"
            export $var_name="$price_id"
            break
        else
            echo "  ✗ Invalid format. Price IDs should start with 'price_'"
            read -p "Try again? (y/n): " retry
            if [[ $retry != "y" ]]; then
                echo "Skipping $description"
                export $var_name=""
                break
            fi
        fi
    done
}

# Collect all Price IDs
echo "=" | sed 's/./-/g'
echo "COLLECTOR PLAN"
echo "=" | sed 's/./-/g'
prompt_price_id "COLLECTOR_MONTHLY" "Collector - Monthly ($29/month)"
prompt_price_id "COLLECTOR_ANNUAL" "Collector - Annual ($290/year)"

echo ""
echo "=" | sed 's/./-/g'
echo "DEALER PLAN"
echo "=" | sed 's/./-/g'
prompt_price_id "DEALER_MONTHLY" "Dealer - Monthly ($99/month)"
prompt_price_id "DEALER_ANNUAL" "Dealer - Annual ($990/year)"

echo ""
echo "=" | sed 's/./-/g'
echo "ENTERPRISE PLAN"
echo "=" | sed 's/./-/g'
prompt_price_id "ENTERPRISE_MONTHLY" "Enterprise - Monthly ($399/month)"
prompt_price_id "ENTERPRISE_ANNUAL" "Enterprise - Annual ($3,990/year)"

echo ""
echo "="
echo "📊 Summary"
echo "="
echo ""
echo "Collector Monthly:  $COLLECTOR_MONTHLY"
echo "Collector Annual:   $COLLECTOR_ANNUAL"
echo "Dealer Monthly:     $DEALER_MONTHLY"
echo "Dealer Annual:      $DEALER_ANNUAL"
echo "Enterprise Monthly: $ENTERPRISE_MONTHLY"
echo "Enterprise Annual:  $ENTERPRISE_ANNUAL"
echo ""

# Confirmation
read -p "❓ Do these look correct? (y/n): " confirm

if [[ $confirm != "y" ]]; then
    echo "❌ Cancelled. Please run the script again."
    exit 1
fi

# Update .env file
ENV_FILE="/home/ubuntu/genesis_provenance/nextjs_space/.env"

echo ""
echo "💾 Updating $ENV_FILE..."

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Add or update Price IDs in .env
for var in STRIPE_PRICE_COLLECTOR_MONTHLY STRIPE_PRICE_COLLECTOR_ANNUAL STRIPE_PRICE_DEALER_MONTHLY STRIPE_PRICE_DEALER_ANNUAL STRIPE_PRICE_ENTERPRISE_MONTHLY STRIPE_PRICE_ENTERPRISE_ANNUAL; do
    # Get the value
    value=$(eval echo \$$var:s/STRIPE_PRICE_//)
    
    # Remove existing line if present
    sed -i "/^$var=/d" "$ENV_FILE"
    
    # Append new line
    echo "$var=$value" >> "$ENV_FILE"
    echo "  ✓ Added $var"
done

echo ""
echo "✅ Success! Price IDs have been added to your .env file."
echo ""
echo "🚀 Next Steps:"
echo "  1. Verify the .env file: cat $ENV_FILE | grep STRIPE_PRICE"
echo "  2. Rebuild your app: cd nextjs_space && yarn build"
echo "  3. Test the billing page: /settings/billing"
echo ""
echo "🎉 You're all set!"
