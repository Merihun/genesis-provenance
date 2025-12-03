# Image Inventory - Genesis Provenance

**Last Updated:** November 29, 2025  
**Total Active Images:** 14 production-quality files  
**Total Legacy Images:** 12 deprecated files

---

## Active Production Images (14 files)

### Luxury Car Category (4 images) - NEW!

| File Name | Size | Dimensions | Usage |
|-----------|------|------------|-------|
| `hero_luxury_car.jpg` | 506 KB | 2048×1152 | Hero sections, car showcase |
| `luxury_car_collection.jpg` | 5.4 MB | High-res | Collection galleries |
| `classic_luxury_car.jpg` | 352 KB | 2048×1152 | Classic car examples |
| `luxury_car_interior_detail.jpg` | 274 KB | 1152×864 | Interior detail views |

### Marketing & Lifestyle (10 images)

| File Name | Size | Dimensions | Usage |
|-----------|------|------------|-------|
| `luxury_lifestyle_hero.jpg` | 348 KB | High-res | Homepage hero section |
| `premium_watch_collection.jpg` | 253 KB | High-res | Product page - Collectors |
| `designer_handbag_collection.jpg` | 272 KB | High-res | Handbag category |
| `fine_jewelry_collection.jpg` | 238 KB | High-res | Jewelry category |
| `fine_art_gallery.jpg` | 244 KB | High-res | Art category |
| `collector_examining_item.jpg` | 241 KB | High-res | Collector use cases |
| `luxury_boutique_interior.jpg` | 282 KB | High-res | Product page - Resellers |
| `business_handshake.jpg` | 198 KB | High-res | Product page - Partners |
| `digital_security_blockchain.jpg` | 205 KB | High-res | Security page hero |
| `provenance_documents.jpg` | 1.3 MB | High-res | Documentation examples |

---

## Image Usage Map

### Homepage (`app/(marketing)/page.tsx`)
- ✅ Hero: `luxury_lifestyle_hero.jpg`

### Product Page (`app/(marketing)/product/page.tsx`)
- ✅ Collectors: `premium_watch_collection.jpg`
- ✅ Resellers: `luxury_boutique_interior.jpg`
- ✅ Partners: `business_handshake.jpg`

### Security Page (`app/(marketing)/security/page.tsx`)
- ✅ Hero: `digital_security_blockchain.jpg`

### Category Pages (Future Use)
- Watches: `premium_watch_collection.jpg`
- Handbags: `designer_handbag_collection.jpg`
- Jewelry: `fine_jewelry_collection.jpg`
- Art: `fine_art_gallery.jpg`
- Luxury Cars: All 4 luxury car images

---

## Legacy Images (Can Be Removed)

These 12 files are no longer referenced and can be deleted:

- `hero-luxury-vault.jpg` (873 KB) - replaced by `luxury_lifestyle_hero.jpg`
- `collector-luxury-watch.jpg` (895 KB) - replaced by `premium_watch_collection.jpg`
- `reseller-boutique.jpg` (727 KB) - replaced by `luxury_boutique_interior.jpg`
- `partners-business.jpg` (521 KB) - replaced by `business_handshake.jpg`
- `digital-security.jpg` (381 KB) - replaced by `digital_security_blockchain.jpg`
- `provenance-documents.jpg` (1.2 MB) - replaced by `provenance_documents.jpg`
- `watch-collection.jpg` (608 KB)
- `handbag-collection.jpg` (1.3 MB)
- `jewelry-collection.jpg` (738 KB)
- `luxury-lifestyle.jpg` (893 KB)
- `luxury-office.jpg` (408 KB)
- `asset-authentication.jpg` (314 KB)

**Cleanup Command:**
```bash
cd /home/ubuntu/genesis_provenance/nextjs_space/public
rm -f hero-luxury-vault.jpg collector-luxury-watch.jpg reseller-boutique.jpg \
      partners-business.jpg digital-security.jpg provenance-documents.jpg \
      watch-collection.jpg handbag-collection.jpg jewelry-collection.jpg \
      luxury-lifestyle.jpg luxury-office.jpg asset-authentication.jpg
```

**Space savings:** ~9.8 MB

---

## Image Optimization

All active images follow these guidelines:

1. ✅ Next.js `Image` component with `fill` prop
2. ✅ Fixed aspect ratio containers
3. ✅ Descriptive alt text
4. ✅ Lazy loading enabled
5. ✅ Responsive sizing
6. ✅ CDN delivery

### Example Implementation

```tsx
<div className="relative h-[400px] rounded-lg overflow-hidden">
  <Image
    src="/luxury_lifestyle_hero.jpg"
    alt="Luxury lifestyle collection"
    fill
    className="object-cover"
  />
</div>
```

---

## Asset Categories Supported

1. ✅ **Watches** - Premium watch collections
2. ✅ **Luxury Cars** - Classic and modern luxury vehicles (NEW!)
3. ✅ **Handbags** - Designer handbag collections
4. ✅ **Jewelry** - Fine jewelry and gemstones
5. ✅ **Art** - Museum-quality artwork
6. ✅ **Collectibles** - High-value collectible items
7. ✅ **Other** - Miscellaneous luxury assets

---

**Maintained By:** Genesis Provenance Development Team  
**Status:** Production-ready
