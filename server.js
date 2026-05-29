const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Silence favicon 404s
app.get('/favicon.ico', (req, res) => res.status(204).end());

function upscaleScene7Url(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('/is/image/') || url.includes('/is/content/') || url.includes('scene7.com') || url.includes('i.dell.com')) {
    try {
      const parsed = new URL(url);
      const paramsToStrip = ['wid', 'hei', 'scl', 'size', 'pscan', 'fit'];
      paramsToStrip.forEach(param => parsed.searchParams.delete(param));
      
      if (!parsed.searchParams.has('fmt')) {
        parsed.searchParams.set('fmt', 'png-alpha');
      }
      parsed.searchParams.set('qlt', '100,1');
      parsed.searchParams.set('resMode', 'sharp2');
      
      return parsed.toString();
    } catch (e) {
      let cleaned = url;
      cleaned = cleaned.replace(/[?&](wid|hei|scl|size|pscan|fit)=[^&]*/g, '');
      if (!cleaned.includes('fmt=')) {
        cleaned += (cleaned.includes('?') ? '&' : '?') + 'fmt=png-alpha';
      }
      if (!cleaned.includes('qlt=')) {
        cleaned += '&qlt=100,1';
      }
      return cleaned;
    }
  }
  return url;
}

// Helper: resolve relative URLs to absolute
function resolveUrl(base, relative) {
  if (!relative || typeof relative !== 'string') return null;
  const trimmed = relative.trim();
  if (trimmed.startsWith('data:')) {
    return trimmed.startsWith('data:image/') ? trimmed : null;
  }
  if (trimmed.startsWith('//')) return upscaleScene7Url(`https:${trimmed}`);
  try {
    return upscaleScene7Url(new URL(trimmed, base).href);
  } catch {
    return null;
  }
}

// Helper: check if a string looks like an image URL
function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:image/')) return true;

  const lower = url.toLowerCase();
  const cleanPath = lower.split('?')[0].split('#')[0];
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif|tiff?)$/.test(cleanPath)) return true;

  // Many commerce CDNs transform images through extensionless endpoints.
  if (/[?&](?:format|fmt|f|fm|type|ext|filetype|sfrm)=(?:jpe?g|png|gif|webp|svg|avif)/i.test(lower)) return true;
  if (/\/dw\/image\/v2\//i.test(lower)) return true;
  if (/product-catalog|master-product-catalog|media\/catalog\/product/i.test(lower)) return true;
  if (/\/(?:images?|img|media|assets?|photos?|pictures?|thumb|thumbnail)s?\//i.test(cleanPath) && /\/image\//i.test(cleanPath)) return true;

  return false;
}

const IMAGE_DATA_ATTRS = [
  'src', 'data-src', 'data-lazy-src', 'data-original', 'data-url',
  'data-image', 'data-img', 'data-full', 'data-full-size', 'data-large',
  'data-large-image', 'data-zoom', 'data-zoom-image', 'data-zoom-src',
  'data-hi-res', 'data-hires', 'data-retina', 'data-2x',
  'data-gallery', 'data-gallery-src', 'data-slide', 'data-photo',
  'data-master', 'data-echo', 'data-lazyload', 'data-lazy',
  'data-normal', 'data-big', 'data-origin', 'data-actualsrc',
  'data-background', 'data-bg', 'data-slide-image',
  'data-thumb', 'data-large_image', 'data-o_src', 'data-o_href',
  'data-full-image', 'data-original-image', 'data-main-image',
];

function addImageCandidate(imageSet, baseUrl, rawUrl) {
  if (typeof rawUrl === 'string' && /^[\s]*[\[{]/.test(rawUrl)) return;
  const resolved = resolveUrl(baseUrl, rawUrl);
  if (resolved && isImageUrl(resolved)) imageSet.add(resolved);
}

function parseSrcset(imageSet, baseUrl, srcset) {
  if (!srcset) return;
  srcset.split(',').forEach((part) => {
    const s = part.trim().split(/\s+/)[0];
    if (s) addImageCandidate(imageSet, baseUrl, s);
  });
}

function addImagesFromJson(value, imageSet, baseUrl) {
  if (!value) return;
  if (typeof value === 'string') {
    addImageCandidate(imageSet, baseUrl, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(item => addImagesFromJson(item, imageSet, baseUrl));
    return;
  }
  if (typeof value !== 'object') return;

  const imageFields = [
    'image', 'images', 'src', 'url', 'href', 'full', 'img', 'thumb', 'thumbnail',
    'thumbnailUrl', 'contentUrl', 'featured_image', 'featuredImage', 'featured_media',
    'media', 'preview_image', 'previewImage', 'originalSrc', 'transformedSrc'
  ];

  imageFields.forEach(field => {
    if (value[field]) addImagesFromJson(value[field], imageSet, baseUrl);
  });

  Object.values(value).forEach(item => {
    if (item && typeof item === 'object') addImagesFromJson(item, imageSet, baseUrl);
  });
}

function scanJsonTextForImages(text, imageSet, baseUrl) {
  if (!text) return;

  const urlPatterns = [
    /https?:\\?\/\\?\/[^"'\s<>]+(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^"'\s<>]*)?/gi,
    /https?:\\?\/\\?\/[^"'\s<>]+\/dw\/image\/v2\/[^"'\s<>]+/gi,
    /\\?\/[^"'\s<>]*(?:media\/catalog\/product|product-catalog|master-product-catalog)[^"'\s<>]+(?:jpg|jpeg|png|webp|avif)?(?:\?[^"'\s<>]*)?/gi,
  ];

  urlPatterns.forEach(re => {
    let match;
    while ((match = re.exec(text)) !== null) {
      const cleaned = match[0].replace(/\\\//g, '/').replace(/\\u0026/g, '&');
      addImageCandidate(imageSet, baseUrl, cleaned);
    }
  });
}

function detectDomainPreset(targetUrl, html, $) {
  const lowerUrl = safeDecodeLower(targetUrl);
  const lowerHtml = String(html || '').toLowerCase();
  let host = '';
  try { host = new URL(targetUrl).hostname.toLowerCase(); } catch { }

  if (host.includes('ray-ban.com')) return { id: 'rayban', label: 'Ray-Ban' };
  if (host.includes('belkin.') || lowerHtml.includes('/dw/image/v2/belkin')) return { id: 'belkin', label: 'Belkin / SFCC' };
  if (lowerHtml.includes('shopify.shop') || lowerHtml.includes('cdn.shopify.com/s/files') || lowerHtml.includes('shopifyanalytics') || /\/products?\//i.test(lowerUrl)) {
    return { id: 'shopify', label: 'Shopify' };
  }
  if (lowerHtml.includes('/dw/image/v2/') || lowerHtml.includes('/on/demandware.store/') || lowerHtml.includes('demandware') || lowerHtml.includes('product-catalog')) {
    return { id: 'sfcc', label: 'Salesforce Commerce Cloud' };
  }
  if (lowerHtml.includes('woocommerce-product-gallery') || lowerHtml.includes('wp-content/plugins/woocommerce') || lowerHtml.includes('wc-ajax=')) {
    return { id: 'woocommerce', label: 'WooCommerce' };
  }
  if (lowerHtml.includes('magento_catalog') || lowerHtml.includes('x-magento-init') || lowerHtml.includes('data-gallery-role') || lowerHtml.includes('media/catalog/product')) {
    return { id: 'magento', label: 'Magento' };
  }
  return { id: 'generic', label: 'Generic' };
}

function applyDomainPreset(preset, $, html, targetUrl, imageSet) {
  if (!preset || preset.id === 'generic') return;

  const scanAttrs = (selector, attrs) => {
    $(selector).each((_, el) => {
      attrs.forEach(attr => addImageCandidate(imageSet, targetUrl, $(el).attr(attr)));
      parseSrcset(imageSet, targetUrl, $(el).attr('srcset') || $(el).attr('data-srcset'));
    });
  };

  if (preset.id === 'shopify') {
    scanAttrs('[data-product-media], [data-media-id], [data-product-single-thumbnail], [data-product-featured-media], .product__media img, .product-media img, .product-gallery img', [
      'src', 'href', 'data-src', 'data-original', 'data-zoom', 'data-zoom-src',
      'data-media-preview-image-url', 'data-product-featured-media'
    ]);
    scanJsonTextForImages(html, imageSet, targetUrl);
  }

  if (preset.id === 'sfcc' || preset.id === 'belkin') {
    scanAttrs('[data-image], [data-large-img], [data-hires], [data-zoom-image], .product-image img, .primary-image, .carousel img', [
      'src', 'href', 'data-src', 'data-image', 'data-large-img', 'data-hires', 'data-zoom-image', 'data-full-size'
    ]);
    scanJsonTextForImages(html, imageSet, targetUrl);
  }

  if (preset.id === 'woocommerce') {
    scanAttrs('.woocommerce-product-gallery img, .woocommerce-product-gallery a, [data-large_image], [data-o_src], [data-thumb]', [
      'src', 'href', 'data-src', 'data-large_image', 'data-o_src', 'data-o_href', 'data-thumb'
    ]);
    scanJsonTextForImages(html, imageSet, targetUrl);
  }

  if (preset.id === 'magento') {
    scanAttrs('[data-gallery-role="gallery-placeholder"], .gallery-placeholder img, .fotorama img, .product.media img', [
      'src', 'href', 'data-src', 'data-full', 'data-img', 'data-thumb', 'data-zoom-image'
    ]);
    $('[data-gallery]').each((_, el) => {
      const raw = $(el).attr('data-gallery');
      if (!raw) return;
      try { addImagesFromJson(JSON.parse(raw), imageSet, targetUrl); }
      catch { scanJsonTextForImages(raw, imageSet, targetUrl); }
    });
    scanJsonTextForImages(html, imageSet, targetUrl);
  }
}

async function fetchShopifyProductImages(targetUrl, imageSet) {
  let productJsonUrl;
  try {
    const parsed = new URL(targetUrl);
    const match = parsed.pathname.match(/\/products\/([^/?#]+)/i);
    if (!match) return;
    productJsonUrl = `${parsed.origin}/products/${match[1]}.js`;
  } catch {
    return;
  }

  try {
    const res = await axios.get(productJsonUrl, {
      timeout: 8000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'application/json,text/plain,*/*',
      },
    });
    addImagesFromJson(res.data, imageSet, targetUrl);
    console.log('[Preset: Shopify] Product JSON images merged');
  } catch (err) {
    console.log('[Preset: Shopify] Product JSON fetch skipped:', err.message);
  }
}

function safeDecodeLower(value) {
  const str = String(value || '');
  try {
    return decodeURIComponent(str).toLowerCase();
  } catch {
    return str.toLowerCase();
  }
}

function productHintsFromUrl(targetUrl) {
  const hints = new Set();
  try {
    const parsed = new URL(targetUrl);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const last = (parts[parts.length - 1] || '').replace(/\.[a-z0-9]+$/i, '');

    [last, ...parts].forEach((part) => {
      const clean = part.replace(/\.[a-z0-9]+$/i, '');
      const skuMatches = clean.match(/[a-z]{2,}\d{2,}[a-z0-9]*/gi) || [];
      skuMatches.forEach((sku) => {
        const lower = sku.toLowerCase();
        hints.add(lower);
        const prefix = lower.match(/^[a-z]+\d+/);
        if (prefix) hints.add(prefix[0]);
      });
    });
  } catch { }
  return [...hints].filter(h => h.length >= 4);
}

function imagePriority(url, targetUrl) {
  const lower = safeDecodeLower(url);
  let score = 0;

  productHintsFromUrl(targetUrl).forEach((hint) => {
    if (lower.includes(hint)) score += /\d/.test(hint) ? 120 : 25;
  });

  if (/\/pdp\/|product-catalog|master-product-catalog|\/hi-res\//i.test(lower)) score += 35;
  if (/hero|gallery|front|side|top|main|primary|webg|shot/i.test(lower)) score += 25;
  if (/cdn\.shopify\.com\/s\/files\/.*\/products?\//i.test(lower)) score += 60;
  if (/media\/catalog\/product/i.test(lower)) score += 60;
  if (/\/dw\/image\/v2\//i.test(lower)) score += 55;
  if (/wp-content\/uploads\/.*\/(product|woocommerce|shop)/i.test(lower)) score += 35;
  if (/logo|favicon|icon|sprite|blank|nav|gnav|banner|promo|warranty|footer|payment/i.test(lower)) score -= 80;

  const sizeMatch = lower.match(/[?&](?:sw|sh|w|width|h|height)=(\d{2,5})/);
  if (sizeMatch) score += Math.min(parseInt(sizeMatch[1], 10) / 10, 90);

  return score;
}

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';

// Realistic desktop User-Agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getCountryCodeForUrl(url) {
  const lower = url.toLowerCase();
  if (lower.includes('/australia/') || lower.includes('/au/') || lower.includes('.com.au') || lower.includes('.au/')) {
    return 'au';
  }
  if (lower.includes('/canada/') || lower.includes('/ca/') || lower.includes('.ca/')) {
    return 'ca';
  }
  if (lower.includes('/uk/') || lower.includes('/gb/') || lower.includes('.co.uk') || lower.includes('.uk/')) {
    return 'gb';
  }
  if (lower.includes('/germany/') || lower.includes('/de/') || lower.includes('.de/')) {
    return 'de';
  }
  if (lower.includes('/italy/') || lower.includes('/it/') || lower.includes('.it/')) {
    return 'it';
  }
  if (lower.includes('/france/') || lower.includes('/fr/') || lower.includes('.fr/')) {
    return 'fr';
  }
  if (lower.includes('/spain/') || lower.includes('/es/') || lower.includes('.es/')) {
    return 'es';
  }
  return 'us';
}

function isBlockedPage(html) {
  if (!html) return true;
  const lower = typeof html === 'string' ? html.toLowerCase() : JSON.stringify(html).toLowerCase();
  
  const blockPatterns = [
    'access denied',
    'attention required',
    'cf-challenge',
    'turnstile',
    'px-captcha',
    'perimeterx',
    'recaptcha',
    'hcaptcha',
    'captcha',
    'security check',
    'human verification',
    'unusual traffic',
    'block page',
    'sucuri',
    'distil networks',
    'please enable cookies',
    'security check to access',
    'allow cookies',
    'just a moment...'
  ];
  
  const isPatternMatch = blockPatterns.some(p => lower.includes(p));
  if (isPatternMatch) return true;
  if (!lower.includes('<body') && !lower.includes('<html')) return true;
  return false;
}

// Ray-Ban specific: use WCS REST API to get all product images
// This bypasses JS rendering entirely by using the internal product catalog API
async function fetchRayBanImages(targetUrl) {
  const country = getCountryCodeForUrl(targetUrl);
  const rbHeaders = {
    'User-Agent': randomUA(),
    'Accept': 'application/json, text/html, */*; q=0.01',
    'Accept-Language': 'en-AU,en;q=0.9',
    'Referer': targetUrl,
    'X-Requested-With': 'XMLHttpRequest',
  };

  // Step 1: fetch static HTML to extract catEntryId and storeId
  // Ray-Ban uses Akamai which blocks direct access - go straight to ScraperAPI
  console.log('[RayBan] Fetching static HTML via ScraperAPI...');
  let staticHtml;
  try {
    const staticApiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=${country}&device_type=desktop`;
    const staticRes = await axios.get(staticApiUrl, { timeout: 50000 });
    staticHtml = staticRes.data;
    console.log('[RayBan] Static HTML fetched, length:', staticHtml.length);
  } catch (e) {
    throw new Error('Could not fetch Ray-Ban page: ' + e.message);
  }


  const cheerio = require('cheerio');
  const $ = cheerio.load(staticHtml);
  const catEntryId = $('input#itemCatentryId').attr('value') || $('input[name="itemCatentryId"]').attr('value');
  const storeId = $('input#storeId').attr('value') || '33152';
  const langId = $('input#langId').attr('value') || '-47';

  if (!catEntryId) {
    throw new Error('Could not extract catEntryId from Ray-Ban page');
  }
  console.log(`[RayBan] Found catEntryId=${catEntryId}, storeId=${storeId}`);

  // Step 2: call WCS REST API to get all product attachments
  // Try directly first (works with Referer header), fall back to ScraperAPI
  const wcsUrl = `https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/byId/${catEntryId}?currency=AUD&langId=${langId}`;
  console.log('[RayBan] Fetching WCS product API:', wcsUrl);

  let wcsData;
  try {
    const wcsRes = await axios.get(wcsUrl, { timeout: 10000, headers: rbHeaders });
    wcsData = wcsRes.data;
    console.log('[RayBan] WCS API fetched directly');
  } catch (e) {
    console.log('[RayBan] Direct WCS fetch failed, trying ScraperAPI:', e.message);
    const wcsApiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(wcsUrl)}&country_code=${country}`;
    const wcsRes = await axios.get(wcsApiUrl, { timeout: 20000 });
    wcsData = wcsRes.data;
    console.log('[RayBan] WCS API fetched via ScraperAPI');
  }

  if (!wcsData || !wcsData.CatalogEntryView || wcsData.CatalogEntryView.length === 0) {
    throw new Error('WCS API returned no product data');
  }

  const entry = wcsData.CatalogEntryView[0];
  const cdnBase = 'https://images2.ray-ban.com/';
  const imageSet = new Set();

  // Add thumbnail and fullImage
  if (entry.thumbnail) imageSet.add(entry.thumbnail);
  if (entry.fullImage) imageSet.add(entry.fullImage);

  // Extract all attachments (PDP Carousel, PLP, Wishlist, etc.)
  if (entry.Attachments && Array.isArray(entry.Attachments)) {
    entry.Attachments.forEach(att => {
      if (att.path) {
        const attPath = att.path;
        // Only include image attachments (not videos/draggable)
        if (attPath.includes('.png') || attPath.includes('.jpg') || attPath.includes('.webp') || attPath.includes('.jpeg')) {
          const fullUrl = `${cdnBase}${attPath}?impolicy=RB_Product`;
          imageSet.add(fullUrl);
        }
      }
    });
  }

  const images = [...imageSet];
  console.log(`[RayBan] WCS API returned ${images.length} images for catEntryId=${catEntryId}`);

  const title = $('title').text() || entry.name || 'Ray-Ban Product';
  return { images, via: 'RayBan WCS API', title };
}


async function fetchHtmlContent(targetUrl) {
  const attempts = [];
  const HEAVY_SITES = [
    'apple.com', 'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
    'linkedin.com', 'tiktok.com', 'pinterest.com', 'reddit.com', 'ray-ban.com',
    'nike.com', 'adidas.com'
  ];
  const isHeavy = HEAVY_SITES.some(d => targetUrl.toLowerCase().includes(d));
  const country = getCountryCodeForUrl(targetUrl);

  if (isHeavy && SCRAPER_API_KEY) {
    // For heavy/protected sites, skip non-JS rendering and try Premium JS rendering immediately (which is highly reliable for bypassing anti-bot)
    attempts.push({
      name: 'ScraperAPI (Premium JS)',
      fn: async () => {
        const res = await axios.get(`https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true&country_code=${country}&device_type=desktop`, { timeout: 60000 });
        return res.data;
      }
    });
    attempts.push({
      name: 'ScraperAPI (JS render)',
      fn: async () => {
        const res = await axios.get(`https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=${country}&device_type=desktop`, { timeout: 45000 });
        return res.data;
      }
    });
  } else {
    // Try Direct
    attempts.push({
      name: 'Direct',
      fn: async () => {
        const res = await axios.get(targetUrl, {
          timeout: 8000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          headers: {
            'User-Agent': randomUA(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'identity',
            'Connection': 'close',
          }
        });
        return res.data;
      }
    });

    if (SCRAPER_API_KEY) {
      attempts.push({
        name: 'ScraperAPI (Fast)',
        fn: async () => {
          const res = await axios.get(`https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=false&country_code=${country}&device_type=desktop`, { timeout: 15000 });
          return res.data;
        }
      });
      attempts.push({
        name: 'ScraperAPI (JS render)',
        fn: async () => {
          const res = await axios.get(`https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=${country}&device_type=desktop`, { timeout: 35000 });
          return res.data;
        }
      });
      attempts.push({
        name: 'ScraperAPI (Premium JS)',
        fn: async () => {
          const res = await axios.get(`https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true&country_code=${country}&device_type=desktop`, { timeout: 50000 });
          return res.data;
        }
      });
    }
  }

  // Fallbacks
  attempts.push(
    {
      name: 'allorigins',
      fn: async () => {
        const res = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, { timeout: 10000 });
        return res.data.contents || res.data;
      }
    },
    {
      name: 'corsproxy',
      fn: async () => {
        const res = await axios.get(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, { timeout: 8000 });
        return res.data;
      }
    }
  );

  let lastError = 'Unknown error';
  for (const attempt of attempts) {
    try {
      console.log(`[Express] Trying ${attempt.name} for ${targetUrl}...`);
      const html = await attempt.fn();
      if (html && html.length > 80) {
        if (isBlockedPage(html)) {
          throw new Error('Response was blocked by CAPTCHA/anti-bot protection');
        }
        console.log(`[Express] Successful fetch via ${attempt.name}`);
        return { html, via: attempt.name };
      }
      throw new Error('Response empty or too short');
    } catch (err) {
      lastError = `${attempt.name}: ${err.message}`;
      console.log(`[Express] Attempt ${attempt.name} failed: ${err.message}`);
    }
  }

  throw new Error(`All scraping methods failed. Last error: ${lastError}`);
}

app.get('/api/limits', async (req, res) => {
  try {
    const response = await axios.get(`https://api.scraperapi.com/account?api_key=${SCRAPER_API_KEY}`, { timeout: 5000 });
    return res.json({
      creditsLeft: response.data.creditsLeft,
      requestLimit: response.data.requestLimit
    });
  } catch (err) {
    console.error('Failed to fetch ScraperAPI limits:', err.message);
    return res.status(500).json({ error: 'Failed to fetch ScraperAPI limits' });
  }
});

app.post(['/scrape', '/api/scrape', '/api/extract'], async (req, res) => {
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  // Ray-Ban specific: use WCS REST API for faster, more complete image extraction
  if (url.toLowerCase().includes('ray-ban.com') && SCRAPER_API_KEY) {
    try {
      console.log('[RayBan] Detected Ray-Ban URL, using WCS API strategy...');
      const { images, via, title } = await fetchRayBanImages(url);
      if (images.length > 0) {
        return res.json({ url, count: images.length, images, title, via, preset: 'Ray-Ban' });
      }
      console.log('[RayBan] WCS API returned no images, falling back to HTML scraping...');
    } catch (err) {
      console.log('[RayBan] WCS API strategy failed:', err.message, '— falling back to HTML scraping.');
    }
  }

  try {
    const { html, via } = await fetchHtmlContent(url);
    const $ = cheerio.load(html);
    const baseUrl = url;
    const imageSet = new Set();
    const preset = detectDomainPreset(url, html, $);

    // 1. <img> and common lazy-load/data attributes
    $('img').each((_, el) => {
      IMAGE_DATA_ATTRS.forEach((attr) => addImageCandidate(imageSet, baseUrl, $(el).attr(attr)));
      parseSrcset(imageSet, baseUrl, $(el).attr('srcset') || $(el).attr('data-srcset') || $(el).attr('data-lazy-srcset'));
    });

    // 2. <noscript> lazy-load fallbacks
    $('noscript').each((_, el) => {
      const inner = $(el).html() || $(el).text() || '';
      const $$ = cheerio.load(inner);
      $$('img').each((__, img) => {
        IMAGE_DATA_ATTRS.forEach((attr) => addImageCandidate(imageSet, baseUrl, $$(img).attr(attr)));
        parseSrcset(imageSet, baseUrl, $$(img).attr('srcset') || $$(img).attr('data-srcset') || $$(img).attr('data-lazy-srcset'));
      });
    });

    // 3. <meta> OG / Twitter / schema image fields
    $('meta').each((_, el) => {
      const prop = ($(el).attr('property') || $(el).attr('name') || '').toLowerCase();
      const content = $(el).attr('content');
      if (content && /(og:image|twitter:image|image_src|thumbnail|primaryimage)/i.test(prop)) {
        addImageCandidate(imageSet, baseUrl, content);
      }
    });

    // 4. Preloaded/social image links
    $('link[href]').each((_, el) => {
      const rel = ($(el).attr('rel') || '').toLowerCase();
      const as = ($(el).attr('as') || '').toLowerCase();
      if (rel.includes('image_src') || (rel.includes('preload') && as === 'image')) {
        addImageCandidate(imageSet, baseUrl, $(el).attr('href'));
      }
    });

    // 5. <picture><source srcset>
    $('source').each((_, el) => {
      parseSrcset(imageSet, baseUrl, $(el).attr('srcset') || $(el).attr('data-srcset'));
    });

    // 6. <a href> and data attributes pointing to image files
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      addImageCandidate(imageSet, baseUrl, href);
      IMAGE_DATA_ATTRS.forEach((attr) => addImageCandidate(imageSet, baseUrl, $(el).attr(attr)));
    });

    // 7. Generic data-* image attributes on any element
    IMAGE_DATA_ATTRS.forEach((attr) => {
      $(`[${attr}]`).each((_, el) => {
        addImageCandidate(imageSet, baseUrl, $(el).attr(attr));
      });
    });

    // 8. Inline style background-image
    $('[style]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const matches = style.match(/url\(['"']?([^'")'\s]+)['"']?\)/gi) || [];
      matches.forEach((m) => {
        const inner = m.replace(/url\(['"']?/i, '').replace(/['"']?\)$/, '');
        addImageCandidate(imageSet, baseUrl, inner);
      });
    });

    // 9. Inline JSON/scripts often contain gallery image URLs
    $('script:not([src])').each((_, el) => {
      const text = $(el).html() || '';
      const absoluteRe = /["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^"'\s]*)?)/gi;
      const relativeRe = /["'](\/[^"'\s]*\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^"'\s]*)?)/gi;
      let match;
      while ((match = absoluteRe.exec(text)) !== null) addImageCandidate(imageSet, baseUrl, match[1]);
      while ((match = relativeRe.exec(text)) !== null) addImageCandidate(imageSet, baseUrl, match[1]);
      scanJsonTextForImages(text, imageSet, baseUrl);
    });

    applyDomainPreset(preset, $, html, url, imageSet);
    if (preset.id === 'shopify') {
      await fetchShopifyProductImages(url, imageSet);
    }

    // Filter and prioritize product-specific images before navigation/promos.
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'images';
    const images = [...imageSet].filter((u) => {
      if (u.startsWith('data:image/')) return true;
      return isImageUrl(u);
    }).map((image, index) => ({ image, index, score: imagePriority(image, url) }))
      .sort((a, b) => (b.score - a.score) || (a.index - b.index))
      .map(item => item.image);

    return res.json({
      url,
      count: images.length,
      images,
      title,
      via,
      preset: preset.label
    });
  } catch (err) {
    console.error('Scrape error:', err.message);

    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return res.status(400).json({ error: 'Could not reach the website. Check the URL and try again.' });
    }
    if (err.response) {
      return res.status(400).json({
        error: `Website returned error ${err.response.status}. The site may be blocking scrapers.`,
      });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(400).json({ error: 'Request timed out. The website took too long to respond.' });
    }

    return res.status(500).json({ error: 'Failed to scrape the page. ' + err.message });
  }
});

// Proxy endpoint: download an image through the server to avoid CORS issues
app.get('/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');

  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 15000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: url,
      },
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Suggest filename
    const urlPath = new URL(url).pathname;
    const filename = path.basename(urlPath) || 'image.jpg';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    response.data.on('error', (e) => {
      console.error('Stream error:', e.message);
      if (!res.headersSent) res.status(500).send('Stream error');
    }).pipe(res);
  } catch (err) {
    res.status(500).send('Failed to proxy image: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`\n🖼️  Image Scraper running at http://localhost:${PORT}\n`);
});
