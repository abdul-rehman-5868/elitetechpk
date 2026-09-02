# Product metafield definitions

Create these under **Shopify Admin → Settings → Custom data → Products** before importing `products-import.csv` (or immediately after, then re-import / overwrite matching handles so text specs apply).

## Spec metafields (CSV-importable)

| Name | Namespace and key | Type | Used by |
| --- | --- | --- | --- |
| Driver size | `custom.driver_size` | Single line text | PDP highlights, best sellers |
| Product weight | `custom.product_weight` | Single line text | PDP highlights, best sellers |
| Battery life | `custom.battery_life` | Single line text | PDP highlights, best sellers |
| Bluetooth version | `custom.bluetooth_version` | Single line text | PDP highlights, best sellers |
| Charging time | `custom.charging_time` | Single line text | PDP highlights, best sellers |
| Wireless range | `custom.wireless_range` | Single line text | PDP highlights, best sellers |

Suggested storefront access: **Read** (so Liquid can render them).

CSV column headers for these fields look like:

```text
Driver size (product.metafields.custom.driver_size)
Product weight (product.metafields.custom.product_weight)
Battery life (product.metafields.custom.battery_life)
Bluetooth version (product.metafields.custom.bluetooth_version)
Charging time (product.metafields.custom.charging_time)
Wireless range (product.metafields.custom.wireless_range)
```

## Product-reference metafields (manual after import)

| Name | Namespace and key | Type | Used by |
| --- | --- | --- | --- |
| PDP upgrades | `custom.pdp_upgrades` | List of products | Popular upgrades block |
| Pairs well with | `custom.pdp_pairs_well_with` | List of products | Pairs well with block |

These cannot be set reliably via the native products CSV. After products exist, copy the handle lists from [`product-metafields.json`](product-metafields.json) into each product’s metafields in Admin.

## Not defined by this theme seed

| Namespace and key | Notes |
| --- | --- |
| `reviews.rating` / `reviews.rating_count` | Created by a reviews app |
| `shopify.disclosure` | Shopify regulatory disclosures |
