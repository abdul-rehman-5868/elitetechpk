# Seed catalog (dummy products)

Theme uploads do **not** create products. Import this package into your Shopify store so listings and the product detail page (PDP) have real catalog data.

## Files

| File | Purpose |
| --- | --- |
| [`products-import.csv`](products-import.csv) | 8 sample Ritual audio products (variants, images, inventory, collections, spec metafields) |
| [`metafield-definitions.md`](metafield-definitions.md) | Metafield types to create in Admin |
| [`product-metafields.json`](product-metafields.json) | Spec values + upgrade / pairs product links by handle |

## Import checklist

### 1. Create metafield definitions

Follow [`metafield-definitions.md`](metafield-definitions.md):

1. Admin → **Settings** → **Custom data** → **Products**
2. Add the six single-line text specs
3. Add `custom.pdp_upgrades` and `custom.pdp_pairs_well_with` as **List of products**

### 2. Import products

1. Admin → **Products** → **Import**
2. Upload [`products-import.csv`](products-import.csv)
3. Publish to the Online Store channel when prompted
4. If you re-import later, use **Overwrite products with matching handles** so metafield/spec updates apply

This creates collections **Best Sellers**, **Headphones**, and **Accessories** (one collection per product via CSV).

### 3. Link upgrades and pairs

Open each product in Admin and set the list metafields using handles from [`product-metafields.json`](product-metafields.json).

**Minimum for a full PDP demo** — open **Ritual Over-Ear Pro** (`ritual-overear-pro`):

- **PDP upgrades** → Travel Case, Premium Cable
- **Pairs well with** → Earbuds Pulse, Desk Stand

### 4. Wire theme sections

In the theme editor:

1. Homepage **Best sellers** (or similar) → select collection **Best Sellers** or the new products
2. Featured product / mega-menu product pickers → choose **Ritual Over-Ear Pro** or Best Sellers products
3. Open `/products/ritual-overear-pro` to verify gallery, inventory, highlights, upgrades, and pairs

### 5. Optional extras

- Add headphones to **Best Sellers** and accessories to more collections in Admin (CSV only supports one Collection per product)
- Install a reviews app if you want star ratings (`reviews.rating`)

## Sample catalog

| Handle | Role | Price | Collection |
| --- | --- | --- | --- |
| `ritual-overear-pro` | Flagship PDP hero (Black / Silver; Silver qty 6) | $349 | Best Sellers |
| `ritual-overear-lite` | Secondary headphones | $199 | Headphones |
| `ritual-earbuds-pulse` | Pairing earbuds | $149 | Best Sellers |
| `ritual-earbuds-air` | Everyday earbuds | $129 | Headphones |
| `ritual-travel-case` | Upgrade | $49 | Accessories |
| `ritual-cable-premium` | Upgrade | $29 | Accessories |
| `ritual-desk-stand` | Pairing accessory | $79 | Accessories |
| `ritual-charging-dock` | Earbud accessory | $59 | Accessories |

```text
ritual-overear-pro
  ├─ upgrades → ritual-travel-case, ritual-cable-premium
  └─ pairs    → ritual-earbuds-pulse, ritual-desk-stand
```


/* Background */

position: absolute;
width: 341.84px;
height: 553.05px;
left: 361.04px;
top: 0px;

background: #FAFAFA;
border-radius: 16.02px;


/* Link → secondary-media */

position: absolute;
height: 341.84px;
left: 0px;
right: 0px;
top: 0px;

background: #FAFAFA;
border-radius: 16.02px 16.02px 0px 0px;


/* Air Beats */

position: absolute;
width: 341.84px;
height: 341.84px;
left: 0px;
top: 0px;



/* Button - Choose options for Air Beats */

position: absolute;
height: 41px;
left: 91.56px;
right: 91.57px;
top: 280.84px;

background: #171717;
opacity: 0;
border-radius: 60px;


/* Background */

position: absolute;
left: 63.85px;
right: 89.86px;
top: 18px;
bottom: 18px;

background: #FFFFFF;
opacity: 0;
border-radius: 2.68435e+07px;


/* Background */

position: absolute;
left: 76.85px;
right: 76.86px;
top: 18px;
bottom: 18px;

background: #FFFFFF;
opacity: 0;
border-radius: 2.68435e+07px;


/* Background */

position: absolute;
left: 89.85px;
right: 63.86px;
top: 18px;
bottom: 18px;

background: #FFFFFF;
opacity: 0;
border-radius: 2.68435e+07px;


/* Border */

box-sizing: border-box;

position: absolute;
left: 0px;
right: 0px;
top: 0px;
bottom: 0px;

border: 1px solid #171717;
border-radius: 60px;


/* Choose options */

position: absolute;
left: 22px;
right: 21.09px;
top: 12.8px;
bottom: 12.8px;

font-family: 'Inter';
font-style: normal;
font-weight: 500;
font-size: 15.4px;
line-height: 15px;
/* identical to box height, or 100% */
display: flex;
align-items: center;
text-align: center;

color: #FFFFFF;



/* Button */

position: absolute;
height: 48px;
left: 277.84px;
right: 16px;
top: 16px;

background: #FFFFFF;
opacity: 0;
backdrop-filter: blur(6px);
/* Note: backdrop-filter has minimal browser support */
border-radius: 60px;


/* Background */

position: absolute;
left: 8.5px;
right: 34.5px;
top: 21.5px;
bottom: 21.5px;

background: #171717;
opacity: 0;
border-radius: 2.68435e+07px;


/* Background */

position: absolute;
left: 21.5px;
right: 21.5px;
top: 21.5px;
bottom: 21.5px;

background: #171717;
opacity: 0;
border-radius: 2.68435e+07px;


/* Background */

position: absolute;
left: 34.5px;
right: 8.5px;
top: 21.5px;
bottom: 21.5px;

background: #171717;
opacity: 0;
border-radius: 2.68435e+07px;


/* Border */

box-sizing: border-box;

position: absolute;
left: 0px;
right: 0px;
top: 0px;
bottom: 0px;

border: 1px solid rgba(23, 23, 23, 0.1);
border-radius: 60px;


/* Frame */

position: absolute;
left: 14px;
right: 14px;
top: 14px;
bottom: 14px;



/* Vector */

position: absolute;
left: 8.33%;
right: 8.33%;
top: 16.67%;
bottom: 16.67%;

border: 1.5px solid #171717;


/* Vector */

position: absolute;
left: 37.5%;
right: 37.5%;
top: 37.5%;
bottom: 37.5%;

border: 1.5px solid #171717;


/* Overlay+OverlayBlur */

position: absolute;
height: 34px;
left: 253.77px;
right: 20.01px;
top: 20px;

background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(6px);
/* Note: backdrop-filter has minimal browser support */
border-radius: 2.68435e+07px;


/* Img - 5.0 out of 5.0 stars */

position: absolute;
width: 14px;
height: 14px;
left: 16px;
top: calc(50% - 14px/2);



/* Vector */

position: absolute;
left: 0%;
right: 0%;
top: 0%;
bottom: 4.89%;

background: #F59E0B;


/* 5.0 */

position: absolute;
width: 16.45px;
height: 12.8px;
left: 36px;
top: calc(50% - 12.8px/2 - 0.7px);

font-family: 'Inter';
font-style: normal;
font-weight: 400;
font-size: 11px;
line-height: 11px;
/* or 100% */
display: flex;
align-items: center;

color: #171717;



/* Link → SonicPulse */

position: absolute;
height: 12px;
left: 32.01px;
right: 236.02px;
top: 365.04px;

font-family: 'Inter';
font-style: normal;
font-weight: 400;
font-size: 10px;
line-height: 10px;
/* or 100% */
display: flex;
align-items: center;
letter-spacing: 1px;
text-transform: uppercase;

color: rgba(23, 23, 23, 0.6);



/* Link → Air Beats */

position: absolute;
height: 23.2px;
left: 32.01px;
right: 228.68px;
top: 385.04px;

font-family: 'Inter';
font-style: normal;
font-weight: 500;
font-size: 18.8px;
line-height: 24px;
/* identical to box height, or 125% */
display: flex;
align-items: center;

color: #171717;



/* $499.00 */

position: absolute;
height: 15.4px;
left: 247.84px;
right: 31.62px;
top: 390.64px;

font-family: 'Inter';
font-style: normal;
font-weight: 400;
font-size: 15.4px;
line-height: 15px;
/* identical to box height, or 100% */
display: flex;
align-items: center;

color: #171717;



/* List */

position: absolute;
height: 32px;
left: 32.01px;
right: 197.83px;
top: 424.54px;



/* Item → Link - Air Beats - Black */

position: absolute;
width: 32px;
height: 32px;
left: 0px;
top: 0px;

background: #FAFAFA;
border-radius: 5px;


/* Overlay+Shadow */

position: absolute;
left: 0px;
right: 0px;
top: 0px;
bottom: 0px;

background: rgba(255, 255, 255, 0.002);
box-shadow: 0px 0px 0px 1px rgba(23, 23, 23, 0.1);
border-radius: 5px;


/* Item → Link - Air Beats - Timber */

position: absolute;
width: 32px;
height: 32px;
left: 40px;
top: 0px;

background: #FAFAFA;
border-radius: 5px;


/* Overlay+Shadow */

position: absolute;
left: 0px;
right: 0px;
top: 0px;
bottom: 0px;

background: rgba(255, 255, 255, 0.002);
box-shadow: 0px 0px 0px 1px rgba(23, 23, 23, 0.1);
border-radius: 5px;


/* Item → Link - Air Beats - Gold Tone */

position: absolute;
width: 32px;
height: 32px;
left: 80px;
top: 0px;

background: #FAFAFA;
border-radius: 5px;


/* Overlay+Shadow */

position: absolute;
left: 0px;
right: 0px;
top: 0px;
bottom: 0px;

background: rgba(255, 255, 255, 0.002);
box-shadow: 0px 0px 0px 1px rgba(23, 23, 23, 0.1);
border-radius: 5px;


/* scroll-shadow */

position: absolute;
height: 64.5px;
left: 0px;
right: 0px;
top: 488.55px;

border-radius: 0px 0px 16.02px 16.02px;


/* Slot */

position: absolute;
height: 63.7px;
left: 0.8px;
right: 0.8px;
top: 0px;
overflow-x: scroll;

background: #FFFFFF;


/* 40mm */

position: absolute;
width: 37.25px;
left: 64px;
top: 16px;
bottom: 32.5px;

font-family: 'Inter';
font-style: normal;
font-weight: 500;
font-size: 12px;
line-height: 12px;
/* or 100% */
display: flex;
align-items: center;

color: #171717;



/* Driver size */

position: absolute;
width: 50.6px;
left: 64px;
top: 33.6px;
bottom: 17.6px;

font-family: 'Inter';
font-style: normal;
font-weight: 400;
font-size: 10px;
line-height: 12px;
/* identical to box height, or 125% */
display: flex;
align-items: center;

color: rgba(23, 23, 23, 0.6);



/* Figure → 40mm */

position: absolute;
width: 24px;
left: 32px;
top: 17.6px;
bottom: 22.1px;



/* driver-size.svg */

position: absolute;
width: 24px;
height: 24px;
left: calc(50% - 24px/2);
top: calc(50% - 24px/2);



/* Clip path group */

position: absolute;
left: 0%;
right: 0%;
top: 0%;
bottom: 0%;



/* a */

position: absolute;
left: 0%;
right: 0%;
top: 0%;
bottom: 0%;



/* Vector */

position: absolute;
left: 0%;
right: 0%;
top: 0%;
bottom: 0%;

background: #000000;


/* Group */

position: absolute;
left: 4.17%;
right: 4.17%;
top: 4.17%;
bottom: 4.17%;

opacity: 0.5;


/* Vector */

position: absolute;
left: 4.17%;
right: 4.17%;
top: 4.17%;
bottom: 4.17%;

border: 1.125px solid #000000;


/* VerticalBorder */

position: absolute;
width: 136.19px;
left: 139.29px;
top: 17.6px;
bottom: 17.6px;



/* 285 g */

position: absolute;
width: 33.23px;
height: 15.2px;
left: 48.79px;
top: -1.6px;

font-family: 'Inter';
font-style: normal;
font-weight: 500;
font-size: 12px;
line-height: 12px;
/* or 100% */
display: flex;
align-items: center;

color: #171717;



/* Product weight */

position: absolute;
width: 71.7px;
height: 12.5px;
left: 48.79px;
top: 16px;

font-family: 'Inter';
font-style: normal;
font-weight: 400;
font-size: 10px;
line-height: 12px;
/* identical to box height, or 125% */
display: flex;
align-items: center;

color: rgba(23, 23, 23, 0.6);



/* Figure → 285 g */

position: absolute;
width: 24px;
height: 24px;
left: 16.79px;
top: 0px;



/* product-weight.svg */

position: absolute;
width: 24px;
height: 24px;
left: calc(50% - 24px/2);
top: calc(50% - 24px/2);



/* Group */

position: absolute;
left: 7.29%;
right: 8.25%;
top: 7.29%;
bottom: 8.25%;

opacity: 0.5;


/* Vector */

position: absolute;
left: 7.29%;
right: 8.25%;
top: 7.29%;
bottom: 8.25%;

border: 1.125px solid #000000;


/* VerticalBorder */

position: absolute;
width: 123.29px;
left: 275.47px;
top: 17.6px;
bottom: 17.6px;



/* 35h */

position: absolute;
width: 22.45px;
height: 15.2px;
left: 48.8px;
top: -1.6px;

font-family: 'Inter';
font-style: normal;
font-weight: 500;
font-size: 12px;
line-height: 12px;
/* or 100% */
display: flex;
align-items: center;

color: #171717;



/* Battery life */

position: absolute;
width: 51.39px;
height: 12.5px;
left: 48.8px;
top: 16px;

font-family: 'Inter';
font-style: normal;
font-weight: 400;
font-size: 10px;
line-height: 12px;
/* identical to box height, or 125% */
display: flex;
align-items: center;

color: rgba(23, 23, 23, 0.6);



/* Figure → 35h */

position: absolute;
width: 24px;
height: 24px;
left: 16.8px;
top: 0px;



/* battery-life.svg */

position: absolute;
width: 24px;
height: 24px;
left: calc(50% - 24px/2);
top: calc(50% - 24px/2);



/* Group */

position: absolute;
left: 22.92%;
right: 20.5%;
top: 6.25%;
bottom: 6.63%;

opacity: 0.6;


/* Vector */

position: absolute;
left: 22.92%;
right: 20.5%;
top: 6.25%;
bottom: 6.63%;

border: 1.125px solid #000000;


/* VerticalBorder */

position: absolute;
width: 123.29px;
left: 398.76px;
top: 17.6px;
bottom: 17.6px;



/* v5.1 */

position: absolute;
width: 21.98px;
height: 15.2px;
left: 48.8px;
top: -1.6px;

font-family: 'Inter';
font-style: normal;
font-weight: 500;
font-size: 12px;
line-height: 12px;
/* or 100% */
display: flex;
align-items: center;

color: #171717;



/* Bluetooth® */

position: absolute;
width: 52.31px;
height: 12.5px;
left: 48.8px;
top: 16px;

font-family: 'Inter';
font-style: normal;
font-weight: 400;
font-size: 10px;
line-height: 12px;
/* identical to box height, or 125% */
display: flex;
align-items: center;

color: rgba(23, 23, 23, 0.6);



/* Figure */

position: absolute;
width: 24px;
height: 24px;
left: 16.8px;
top: 0px;

background: #FAFAFA;


/* v5.1 */

position: absolute;
left: 0px;
right: 0px;
top: 0px;
bottom: 0px;

opacity: 0;


/* bluetooth.svg */

position: absolute;
width: 24px;
height: 24px;
left: calc(50% - 24px/2);
top: calc(50% - 24px/2);



/* Group */

position: absolute;
left: 20.83%;
right: 20.83%;
top: 8.33%;
bottom: 8.33%;

opacity: 0.5;


/* Vector */

position: absolute;
left: 20.83%;
right: 20.83%;
top: 8.33%;
bottom: 8.33%;

border: 1.125px solid #000000;


/* Horizontal Divider */

position: absolute;
height: 2px;
left: 33.04%;
right: 33%;
top: calc(50% - 2px/2);

background: #FFFFFF;


/* Horizontal Divider */

position: absolute;
height: 2px;
left: 33.04%;
right: 33%;
top: calc(50% - 2px/2);

background: #171717;


/* Strikethrough */

position: absolute;
left: 0.8px;
right: 0.8px;
top: 0px;
bottom: 0.8px;

border-radius: 0px 0px 16.02px 16.02px;


/* Gradient */

position: absolute;
width: 71.94px;
left: 0px;
top: 0px;
bottom: 0px;

background: linear-gradient(90deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%);
opacity: 0;


/* Gradient */

position: absolute;
width: 71.94px;
right: 0px;
top: 0px;
bottom: 0px;

background: linear-gradient(270deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%);
