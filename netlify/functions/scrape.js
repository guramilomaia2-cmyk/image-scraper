const https = require('https');
const http = require('http');
const { URL } = require('url');

// ══════════════════════════════════════════
//  ScraperAPI key — replace with your key from scraperapi.com
//  Free tier: 1000 requests/month
// ══════════════════════════════════════════
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';

// Rotate through realistic browser User-Agents
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
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

exports.handler = async function (event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let rawBody = event.body || '';
    if (event.isBase64Encoded) {
        rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
    }

    let targetUrl;
    try {
        const parsed = JSON.parse(rawBody || '{}');
        targetUrl = parsed.url;
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON: ' + e.message }) };
    }

    if (!targetUrl) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'url field is required' }) };
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
    }

    // Build attempt chain:
    // 1. ScraperAPI (if key is set) — bypasses Cloudflare
    // List of "heavy" or strictly protected domains that require JS rendering/proxies
    const attempts = [];
    const HEAVY_SITES = [
        'apple.com', 'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
        'linkedin.com', 'tiktok.com', 'pinterest.com', 'reddit.com', 'ray-ban.com',
        'nike.com', 'adidas.com'
    ];
    const isHeavy = HEAVY_SITES.some(d => targetUrl.toLowerCase().includes(d));
    const country = getCountryCodeForUrl(targetUrl);

    if (isHeavy && SCRAPER_API_KEY) {
        // For heavy/protected sites, skip non-JS rendering and try Premium JS rendering immediately (highly reliable for bypassing anti-bot)
        attempts.push({
            name: 'ScraperAPI (Premium JS)',
            fn: () => fetchUrl(
                `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true&country_code=${country}&device_type=desktop`,
                0, { timeout: 60000 }
            ),
        });
        attempts.push({
            name: 'ScraperAPI (JS render)',
            fn: () => fetchUrl(
                `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=${country}&device_type=desktop`,
                0, { timeout: 45000 }
            ),
        });
    } else {
        // For normal sites, try direct fetch first (fastest)
        attempts.push({
            name: 'Direct',
            fn: () => fetchUrl(targetUrl, 0, { timeout: 4000 }),
        });

        if (SCRAPER_API_KEY) {
            attempts.push({
                name: 'ScraperAPI (Fast)',
                fn: () => fetchUrl(
                    `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=false&country_code=${country}&device_type=desktop`,
                    0, { timeout: 15000 }
                ),
            });
            attempts.push({
                name: 'ScraperAPI (JS render)',
                fn: () => fetchUrl(
                    `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=${country}&device_type=desktop`,
                    0, { timeout: 35000 }
                ),
            });
            attempts.push({
                name: 'ScraperAPI (Premium JS)',
                fn: () => fetchUrl(
                    `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true&country_code=${country}&device_type=desktop`,
                    0, { timeout: 50000 }
                ),
            });
        }
    }

    // Fallbacks for everything
    attempts.push(
        { name: 'allorigins', fn: () => fetchViaAllorigins(targetUrl) },
        { name: 'corsproxy', fn: () => fetchUrl(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, 0, { timeout: 8000 }) },
    );

    // ── Ray-Ban specific: use WCS REST API for reliable product image extraction ──
    if (targetUrl.toLowerCase().includes('ray-ban.com') && SCRAPER_API_KEY) {
        try {
            console.log('[RayBan] Using WCS API strategy...');

            // Step 1: fetch static HTML via ScraperAPI to extract catEntryId
            const staticApiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&country_code=${country}&device_type=desktop`;
            const staticHtml = await fetchUrl(staticApiUrl, 0, { timeout: 50000 });
            console.log('[RayBan] Static HTML fetched, length:', staticHtml.length);

            // Extract catEntryId and storeId from hidden inputs
            const catEntryMatch = staticHtml.match(/id="itemCatentryId"[^>]*value="(\d+)"/i)
                || staticHtml.match(/name="itemCatentryId"[^>]*value="(\d+)"/i)
                || staticHtml.match(/value="(\d+)"[^>]*id="itemCatentryId"/i);
            const storeMatch = staticHtml.match(/id="storeId"[^>]*value="(\d+)"/i)
                || staticHtml.match(/value="(\d+)"[^>]*id="storeId"/i);
            const catEntryId = catEntryMatch && catEntryMatch[1];
            const storeId = (storeMatch && storeMatch[1]) || '33152';
            const langId = '-47';

            if (!catEntryId) throw new Error('catEntryId not found in HTML');
            console.log(`[RayBan] catEntryId=${catEntryId}, storeId=${storeId}`);

            // Step 2: call WCS REST API (works with Referer header)
            const wcsUrl = `https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/byId/${catEntryId}?currency=AUD&langId=${langId}`;
            const wcsHtml = await fetchUrl(wcsUrl, 0, {
                timeout: 15000,
                extraHeaders: {
                    'Referer': targetUrl,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Language': 'en-AU,en;q=0.9',
                }
            });

            let wcsData;
            try { wcsData = JSON.parse(wcsHtml); } catch (e) { throw new Error('WCS response not JSON'); }
            const entry = wcsData && wcsData.CatalogEntryView && wcsData.CatalogEntryView[0];
            if (!entry) throw new Error('No CatalogEntryView in WCS response');

            const cdnBase = 'https://images2.ray-ban.com/';
            const imageSet = new Set();
            if (entry.thumbnail) imageSet.add(entry.thumbnail);
            if (entry.fullImage) imageSet.add(entry.fullImage);
            if (entry.Attachments && Array.isArray(entry.Attachments)) {
                entry.Attachments.forEach(att => {
                    if (att.path && (att.path.includes('.png') || att.path.includes('.jpg') || att.path.includes('.webp') || att.path.includes('.jpeg'))) {
                        imageSet.add(`${cdnBase}${att.path}?impolicy=RB_Product`);
                    }
                });
            }

            const images = [...imageSet];
            console.log(`[RayBan] WCS returned ${images.length} images`);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ images, count: images.length, url: targetUrl, via: 'RayBan WCS API' }),
            };
        } catch (err) {
            console.log('[RayBan] WCS strategy failed, falling back:', err.message);
        }
    }

    // ── Standard HTML scraping for all other sites ──
    let lastError = 'Unknown error';
    for (const attempt of attempts) {
        try {
            console.log(`Trying ${attempt.name}...`);
            const html = await attempt.fn();

            // Check for valid HTML content (not captcha or error page)
            if (!html || html.length < 80) {
                throw new Error('Response too short (<80 chars)');
            }
            if (isBlockedPage(html)) {
                throw new Error('Response was blocked by CAPTCHA/anti-bot protection');
            }
            if (html.includes('enable JavaScript') && !html.includes('<body')) {
                throw new Error('JS required path triggered');
            }

            const MAX = 4 * 1024 * 1024;
            const safe = html.length > MAX ? html.slice(0, MAX) : html;
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ contents: safe, url: targetUrl, via: attempt.name }),
            };
        } catch (err) {
            lastError = `${attempt.name}: ${err.message || 'failed'}`;
            console.log(`Attempt failed: ${lastError}`);
        }
    }

    return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: `ყველა მცდელობა ჩავარდა. ბოლო შეცდომა: ${lastError}` }),
    };
};


async function fetchViaAllorigins(targetUrl) {
    // 10s timeout for proxy
    const html = await fetchUrl(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, 0, { timeout: 10000 });
    try {
        const json = JSON.parse(html);
        if (json && json.contents) return json.contents;
    } catch { }
    return html;
}

function fetchUrl(urlStr, redirectCount = 0, options = {}) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) return reject(new Error('Too many redirects'));

        let parsed;
        try { parsed = new URL(urlStr); } catch (e) { return reject(new Error('Invalid URL: ' + e.message)); }

        const lib = parsed.protocol === 'https:' ? https : http;

        const reqOptions = {
            hostname: parsed.hostname,
            port: parsed.port ? parseInt(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80),
            path: (parsed.pathname || '/') + (parsed.search || ''),
            method: 'GET',
            headers: {
                'User-Agent': randomUA(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Connection': 'close',
                ...(options.extraHeaders || {}),
            },
            timeout: options.timeout || 20000, // Default 20s
            rejectUnauthorized: false,
        };

        const req = lib.request(reqOptions, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                try {
                    // Resolve relative redirects
                    const next = new URL(res.headers.location, urlStr).href;
                    resolve(fetchUrl(next, redirectCount + 1, options));
                } catch {
                    reject(new Error('Bad redirect URL'));
                }
                return;
            }

            if (res.statusCode < 200 || res.statusCode >= 400) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }

            const chunks = [];
            let total = 0;
            const LIMIT = 4 * 1024 * 1024;

            res.on('data', chunk => {
                total += chunk.length;
                chunks.push(chunk);
                if (total >= LIMIT) req.destroy();
            });
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            res.on('error', reject);
        });

        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout after 20s')); });
        req.on('error', err => reject(new Error(err.message)));
        req.end();
    });
}
