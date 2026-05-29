# Image Scraper Ideas

Ideas to make the product image scraping workflow faster and cleaner.

## High-impact features

1. Product Photos Only mode
   - Hide logos, favicons, banners, navigation images, promo images, and icons.
   - Keep likely product gallery, PDP, hero, front, side, top, and detail images.

2. Batch URL scraping
   - Paste many product URLs into one textarea.
   - Scrape them one by one.
   - Export one ZIP with a separate folder per product/page.

3. Auto High-Res button
   - Detect CDN size parameters like `sw=280`, `sw=700`, `w=800`, `q=95`.
   - Try larger versions such as 1200, 1600, and 2000.
   - Keep the best available image URL.

## Cleanup and review

4. Smart duplicate cleaner
   - Group the same image shown at multiple sizes.
   - Show variants inside one image group, such as 280px, 700px, 1200px.

5. Before Download review mode
   - Show selected/downloadable images on a clean review screen.
   - Make it fast to remove unwanted images before exporting.

6. Download Main 8 button
   - Download only the top-ranked product images.
   - Useful for product pages where the first 6-10 images are usually enough.

## Export improvements

7. Filename template
   - Generate clean names like `BPB027hqBK_hero_01.jpg`, `BPB027hqBK_front.jpg`, `BPB027hqBK_top.jpg`.
   - Use product SKU, title, image role, and index.

8. Export CSV / JSON
   - Export image metadata: `url`, `filename`, `width`, `height`, `type`, `size`, `score`, `sourcePage`.

9. Product info extraction
   - Extract product title, SKU, price, brand, color, and breadcrumbs.
   - Use this info in folders, filenames, CSV, and ZIP naming.

## Smarter scraping

10. Gallery ranking labels
    - Show labels like Product, Hero, Promo, Logo, Icon, and Unknown.
    - Make filtering and manual review easier.

11. Domain presets
    - Add specialized rules for common platforms and stores.
    - Candidates: Shopify, Salesforce Commerce Cloud, WooCommerce, Magento, Ray-Ban, Belkin.

12. Browser Render mode
    - Render pages with a real browser before extracting images.
    - Useful for highly dynamic sites that only load gallery images after JavaScript runs.

## Suggested first build order

1. Product Photos Only mode
2. Batch URL scraping
3. Auto High-Res button
