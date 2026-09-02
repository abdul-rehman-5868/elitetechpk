# Storefront verification checklist

After `seed-store.py` or CSV import + theme sync.

| # | URL / action | Pass criteria |
| --- | --- | --- |
| 1 | `/collections` | Reference grid: All products + Laptops, Headphones, Chargers, Earphones, Accessories — titles, counts, images, and taglines from Shopify |
| 2 | `/` | Featured Apex Ultrabook 14; story cards; best-seller tabs filled |
| 3 | `/collections/laptops` | 7 laptops |
| 4 | `/collections/headphones` | 7 headphones |
| 5 | `/collections/chargers` | 7 chargers |
| 6 | `/collections/earphones` | 7 earphones |
| 7 | `/collections/accessories` | 8 accessories |
| 8 | `/products/apex-ultrabook-14` | Specs, upgrades, pairs, low inventory (qty 6) |
| 9 | Header mega menus | 4 categories + popular products |
| 10 | Search “Apex” + add to cart | Results + cart line item |

Collection card images use each collection’s image, or the first product image in that collection when no collection image is set.
