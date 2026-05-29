(() => {
    // ══════════════════════════════════════════
    //  Environment detection
    // ══════════════════════════════════════════
    const IS_LOCAL = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const CORS_PROXIES = [
        (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];

    // ══════════════════════════════════════════
    //  DOM refs
    // ══════════════════════════════════════════
    const urlInput = document.getElementById('urlInput');
    const urlHistoryList = document.getElementById('urlHistory');
    const scrapeBtn = document.getElementById('scrapeBtn');
    const statusBar = document.getElementById('statusBar');
    const loadingState = document.getElementById('loadingState');
    const controlsBar = document.getElementById('controlsBar');
    const resultsHeader = document.getElementById('resultsHeader');
    const imageGrid = document.getElementById('imageGrid');
    const emptyState = document.getElementById('emptyState');
    const noFilterState = document.getElementById('noFilterState');
    const initialState = document.getElementById('initialState');
    const imageCount = document.getElementById('imageCount');
    const filteredCount = document.getElementById('filteredCount');
    const filteredNum = document.getElementById('filteredNum');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const downloadBtnLabel = document.getElementById('downloadBtnLabel');
    const exportUrlsBtn = document.getElementById('exportUrlsBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const selectedCount = document.getElementById('selectedCount');
    const clearBtn = document.getElementById('clearBtn');
    const sortSelect = document.getElementById('sortSelect');
    const minSizeInput = document.getElementById('minSizeInput');
    const gridSlider = document.getElementById('gridSlider');
    const themeToggle = document.getElementById('themeToggle');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxUrl = document.getElementById('lightboxUrl');
    const lightboxResolution = document.getElementById('lightboxResolution');
    const lightboxFileSize = document.getElementById('lightboxFileSize');
    const lightboxIndex = document.getElementById('lightboxIndex');
    const lightboxDownload = document.getElementById('lightboxDownload');
    const lightboxCopy = document.getElementById('lightboxCopy');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const toast = document.getElementById('toast');
    const apiLimitsWrap = document.getElementById('apiLimitsWrap');
    const limitsLeft = document.getElementById('limitsLeft');
    const limitsTotal = document.getElementById('limitsTotal');

    // ══════════════════════════════════════════
    //  State
    // ══════════════════════════════════════════
    let allImages = [];   // raw extracted images (after dedup + min-size)
    let displayImages = [];   // after filter/sort
    let selectedUrls = new Set();
    let lightboxIndex_val = 0;
    let pageTitle = 'images';
    let currentSourceUrl = '';
    let currentProductHints = [];
    let currentDomainPreset = '';
    let fileSizeCache = {};   // url → formatted size string

    // ══════════════════════════════════════════
    //  Theme
    // ══════════════════════════════════════════
    const savedTheme = localStorage.getItem('scraper-theme-v2') || 'light';
    applyTheme(savedTheme);

    function refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons({
                attrs: {
                    'stroke-width': 2,
                    'aria-hidden': 'true',
                },
            });
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        themeToggle.innerHTML = theme === 'dark'
            ? '<i data-lucide="moon" class="icon"></i>'
            : '<i data-lucide="sun" class="icon"></i>';
        localStorage.setItem('scraper-theme-v2', theme);
        refreshIcons();
    }

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // ══════════════════════════════════════════
    //  URL History (localStorage)
    // ══════════════════════════════════════════
    function getHistory() {
        try { return JSON.parse(localStorage.getItem('scraper-history') || '[]'); } catch { return []; }
    }

    function addToHistory(url) {
        let hist = getHistory().filter(u => u !== url);
        hist.unshift(url);
        hist = hist.slice(0, 10);
        localStorage.setItem('scraper-history', JSON.stringify(hist));
        renderHistory();
    }

    function renderHistory() {
        urlHistoryList.innerHTML = '';
        getHistory().forEach(url => {
            const opt = document.createElement('option');
            opt.value = url;
            urlHistoryList.appendChild(opt);
        });
    }

    renderHistory();

    // ══════════════════════════════════════════
    //  Toast
    // ══════════════════════════════════════════
    let toastTimer;
    function showToast(msg, duration = 3000) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        requestAnimationFrame(() => toast.classList.add('show'));
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, duration);
    }

    // ══════════════════════════════════════════
    //  UI Helpers
    // ══════════════════════════════════════════
    function setStatus(msg, type = 'error') {
        statusBar.textContent = msg;
        statusBar.className = `status-bar ${type}`;
        statusBar.classList.remove('hidden');
    }
    function clearStatus() {
        statusBar.classList.add('hidden');
        statusBar.textContent = '';
    }
    function showLoading(show) {
        loadingState.classList.toggle('hidden', !show);
    }

    async function fetchApiLimits() {
        const endpoints = [];
        if (location.protocol === 'file:') {
            endpoints.push('http://localhost:3000/api/limits');
        } else {
            endpoints.push('/api/limits', '/.netlify/functions/limits');
        }
        for (const endpoint of endpoints) {
            try {
                const resp = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
                if (resp.ok) {
                    const json = await resp.json();
                    if (json && json.creditsLeft !== undefined) {
                        limitsLeft.textContent = json.creditsLeft.toLocaleString();
                        limitsTotal.textContent = json.requestLimit.toLocaleString();
                        apiLimitsWrap.style.display = 'flex';
                        return;
                    }
                }
            } catch (e) { /* fallback */ }
        }
    }

    function resetUI() {
        initialState.classList.remove('hidden');
        controlsBar.classList.add('hidden');
        resultsHeader.classList.add('hidden');
        emptyState.classList.add('hidden');
        noFilterState.classList.add('hidden');
        imageGrid.innerHTML = '';
        clearStatus();
        allImages = [];
        displayImages = [];
        currentSourceUrl = '';
        currentProductHints = [];
        currentDomainPreset = '';
        selectedUrls.clear();
        fileSizeCache = {};
        dimensionCache = {};
        updateSelectionUI();
        sortSelect.value = 'default';
    }

    // ══════════════════════════════════════════
    //  Grid slider
    // ══════════════════════════════════════════
    gridSlider.addEventListener('input', () => {
        document.documentElement.style.setProperty('--grid-col-size', gridSlider.value + 'px');
    });

    // ══════════════════════════════════════════
    //  Selection
    // ══════════════════════════════════════════
    function updateSelectionUI() {
        const count = selectedUrls.size;
        selectedCount.textContent = count;
        deselectAllBtn.classList.toggle('hidden', count === 0);
        const labelEl = document.getElementById('downloadBtnLabel');
        if (labelEl) {
            labelEl.textContent = count > 0
                ? `გადმოწერა (${count})`
                : 'ყველას გადმოწერა';
        }
    }

    function toggleSelect(url, card) {
        if (selectedUrls.has(url)) {
            selectedUrls.delete(url);
            card.classList.remove('selected');
        } else {
            selectedUrls.add(url);
            card.classList.add('selected');
        }
        updateSelectionUI();
    }

    deselectAllBtn.addEventListener('click', () => {
        selectedUrls.clear();
        document.querySelectorAll('.image-card.selected').forEach(c => c.classList.remove('selected'));
        updateSelectionUI();
        showToast('✅ მონიშვნა მოხსნილია');
    });

    // ══════════════════════════════════════════
    //  Fetch HTML via Backend or CORS proxy
    // ══════════════════════════════════════════
    async function fetchHtml(targetUrl) {
        let lastError = '';

        // Try the local or hosted backend first (Express or Netlify)
        const endpoints = [];
        if (location.protocol === 'file:') {
            endpoints.push('http://127.0.0.1:3000/api/scrape', 'http://localhost:3000/api/scrape', 'http://localhost:3000/scrape');
        } else {
            endpoints.push('/api/scrape', '/api/extract', '/.netlify/functions/scrape', '/scrape');
        }

        if (true) {
            for (const endpoint of endpoints) {
                let resp, text;
                try {
                    resp = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: targetUrl }),
                        signal: AbortSignal.timeout(120000), // 120s timeout (Ray-Ban WCS API needs ~60s)
                    });
                    text = await resp.text();
                } catch (err) {
                    lastError = err.message;
                    continue;
                }

                if (!resp.ok) {
                    try {
                        const errJson = JSON.parse(text);
                        lastError = errJson.error || `HTTP ${resp.status}`;
                        // If it's the actual Netlify function returning an error, don't keep trying random endpoints
                        if (endpoint.includes('.netlify')) break;
                    } catch {
                        lastError = `HTTP ${resp.status}`;
                    }
                    continue;
                }

                if (!text || !text.trim()) {
                    lastError = 'ცარიელი პასუხი';
                    continue;
                }

                let json;
                try { json = JSON.parse(text); } catch {
                    if (text.trim().startsWith('<')) return text;
                    lastError = 'JSON parse error';
                    continue;
                }

                if (json.preset) currentDomainPreset = json.preset;
                if (json.contents) {
                    return json.preset
                        ? `<meta name="scraper-domain-preset" content="${escapeHtml(json.preset)}">\\n${json.contents}`
                        : json.contents;
                }
                if (json.images && Array.isArray(json.images)) {
                    let fakeHtml = '';
                    if (json.preset) fakeHtml += `<meta name="scraper-domain-preset" content="${escapeHtml(json.preset)}">\\n`;
                    if (json.title) fakeHtml += `<title>${escapeHtml(json.title)}</title>\\n`;
                    fakeHtml += json.images.map(img => `<img src="${escapeHtml(img)}">`).join('\\n');
                    return fakeHtml;
                }
                
                lastError = 'Invalid response format';
            }
        }

        // Local fallback: use public CORS proxies
        try {
            const resp = await fetch(CORS_PROXIES[0](targetUrl), { signal: AbortSignal.timeout(15000) });
            if (resp.ok) {
                const json = await resp.json();
                if (json && json.contents) return json.contents;
            }
        } catch { }

        try {
            const resp = await fetch(CORS_PROXIES[1](targetUrl), { signal: AbortSignal.timeout(15000) });
            if (resp.ok) return await resp.text();
        } catch { }

        if (lastError) {
            throw new Error('საიტი ვერ ჩაიტვირთა: ' + lastError);
        }
        throw new Error('საიტი ვერ ჩაიტვირთა. შეამოწმე ლინკი ან სცადე სხვა საიტი.');
    }

    // ══════════════════════════════════════════
    //  URL helpers
    // ══════════════════════════════════════════
    function resolveUrl(base, relative) {
        if (!relative) return null;
        relative = relative.trim();
        if (/^[\[{]/.test(relative)) return null;
        if (relative.startsWith('data:')) return relative.startsWith('data:image/') ? relative : null;
        if (relative.startsWith('//')) return `https:${relative}`;
        try { return new URL(relative, base).href; } catch { return null; }
    }

    function getExtension(url) {
        if (!url) return '';
        if (url.startsWith('data:image/')) {
            const m = url.match(/data:image\/([a-z0-9+]+)/i);
            return m ? m[1].toLowerCase() : '';
        }
        const clean = url.toLowerCase().split('?')[0].split('#')[0];
        const m = clean.match(/\.([a-z0-9]+)$/);
        return m ? m[1] : '';
    }

    function isImageUrl(url) {
        if (!url) return false;
        if (url.startsWith('data:image/')) return true;
        const ext = getExtension(url);
        if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif|tiff?)$/.test(ext)) return true;

        // Accept URLs with image format query params
        const lower = url.toLowerCase();
        if (/[?&](?:format|fmt|f|fm|type|ext|filetype|sfrm)=(?:jpe?g|png|gif|webp|svg|avif)/.test(lower)) return true;
        if (/\/dw\/image\/v2\//i.test(lower)) return true;
        if (/product-catalog|master-product-catalog|media\/catalog\/product/i.test(lower)) return true;

        // Accept known image CDN domains (even without extension)
        const CDN_PATTERNS = [
            /images\.unsplash\.com/,
            /cdn\.shopify\.com\/s\/files/,
            /cloudinary\.com\/.*\/image\//,
            /akamaized\.net/,
            /fastly\.net/,
            /imgix\.net/,
            /apple\.com\/.*\/images\//,
            /apple\.com\/v\//,
            /mzstatic\.com/,
            /media\.istockphoto\.com/,
            /images\.pexels\.com/,
            /img\.freepik\.com/,
            /upload\.wikimedia\.org/,
            /media\.giphy\.com/,
        ];
        if (CDN_PATTERNS.some(re => re.test(url))) return true;

        // Accept URLs whose path ends with image-like segment (no extension but looks like image path)
        try {
            const pathname = new URL(url).pathname.toLowerCase();
            if (/\/(image|photo|img|picture|thumb|thumbnail|media|asset|file)s?\//i.test(pathname)) return true;
        } catch (e) { /* ignore */ }

        return false;
    }

    function safeDecodeLower(value) {
        const str = String(value || '');
        try { return decodeURIComponent(str).toLowerCase(); }
        catch { return str.toLowerCase(); }
    }

    const PRODUCT_HINT_STOP_WORDS = new Set([
        'the', 'and', 'for', 'with', 'from', 'official', 'store', 'shop', 'buy',
        'sale', 'new', 'best', 'online', 'product', 'products', 'collection',
        'category', 'page', 'home', 'men', 'women', 'kids'
    ]);

    function normalizeHintTerm(value) {
        return safeDecodeLower(value)
            .replace(/&amp;/g, '&')
            .replace(/[_+]+/g, ' ')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
    }

    function addProductHint(map, value, weight) {
        const normalized = normalizeHintTerm(value);
        if (!normalized || normalized.length < 4) return;
        if (PRODUCT_HINT_STOP_WORDS.has(normalized)) return;

        const compact = normalized.replace(/\s+/g, '');
        if (compact.length < 4) return;
        if (!/\d/.test(compact) && PRODUCT_HINT_STOP_WORDS.has(compact)) return;

        const existing = map.get(normalized);
        if (!existing || existing.weight < weight) {
            map.set(normalized, { term: normalized, compact, weight });
        }
    }

    function addSkuHints(map, text, weight) {
        const lower = safeDecodeLower(text);
        const matches = lower.match(/[a-z0-9]*[a-z][a-z0-9-]*\d[a-z0-9-]*/gi) || [];
        matches.forEach(match => {
            addProductHint(map, match, weight);
            addProductHint(map, match.replace(/-/g, ''), weight + 15);
            const prefix = match.match(/^[a-z]+\d+/i);
            if (prefix) addProductHint(map, prefix[0], weight - 10);
        });
    }

    function addTextHints(map, text, baseWeight) {
        const normalized = normalizeHintTerm(text);
        if (!normalized) return;
        addSkuHints(map, normalized, baseWeight + 45);

        const tokens = normalized
            .split(' ')
            .filter(token => token.length >= 4 && !PRODUCT_HINT_STOP_WORDS.has(token));

        tokens.forEach(token => {
            addProductHint(map, token, /\d/.test(token) ? baseWeight + 35 : baseWeight);
        });

        for (let size = 2; size <= 4; size++) {
            for (let i = 0; i <= tokens.length - size; i++) {
                const phrase = tokens.slice(i, i + size).join(' ');
                addProductHint(map, phrase, baseWeight + (size * 10));
            }
        }
    }

    function collectProductHints(baseUrl, doc) {
        const hints = new Map();

        productHintsFromUrl(baseUrl).forEach(hint => addProductHint(hints, hint, /\d/.test(hint) ? 125 : 35));

        try {
            const parsed = new URL(baseUrl);
            parsed.pathname.split('/').filter(Boolean).forEach(part => {
                addTextHints(hints, part.replace(/\.[a-z0-9]+$/i, ''), 28);
            });
        } catch { }

        if (doc) {
            const texts = [
                doc.querySelector('title')?.textContent || '',
                doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
                doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '',
                doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                doc.querySelector('[itemprop="sku"]')?.textContent || '',
                doc.querySelector('[itemprop="mpn"]')?.textContent || '',
                doc.querySelector('[itemprop="name"]')?.textContent || '',
                doc.querySelector('h1')?.textContent || '',
            ];

            texts.forEach((text, index) => {
                const mainChunk = String(text).split(/\s[|–—-]\s|::|›|»/)[0];
                addTextHints(hints, mainChunk, index <= 2 ? 45 : 30);
            });
        }

        return [...hints.values()]
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 45);
    }

    function productHintMatchScore(url) {
        if (!currentProductHints.length) return 0;

        const lower = safeDecodeLower(url);
        const spaced = lower.replace(/[^a-z0-9]+/g, ' ');
        const compact = spaced.replace(/\s+/g, '');

        return currentProductHints.reduce((score, hint) => {
            const hyphenated = hint.term.replace(/\s+/g, '-');
            const termMatch = spaced.includes(hint.term) || lower.includes(hyphenated);
            const compactMatch = hint.compact.length >= 5 && compact.includes(hint.compact);

            if (!termMatch && !compactMatch) return score;
            const exactBonus = /\d/.test(hint.compact) ? 1.25 : 1;
            return score + Math.round(hint.weight * exactBonus);
        }, 0);
    }

    function detectDomainPresetFromPage(baseUrl, doc) {
        const lowerUrl = safeDecodeLower(baseUrl);
        const html = safeDecodeLower((doc.documentElement?.innerHTML || '').slice(0, 250000));
        let host = '';
        try { host = new URL(baseUrl).hostname.toLowerCase(); } catch { }

        if (host.includes('ray-ban.com')) return 'Ray-Ban';
        if (host.includes('belkin.') || html.includes('/dw/image/v2/belkin')) return 'Belkin / SFCC';
        if (html.includes('shopify.shop') || html.includes('cdn.shopify.com/s/files') || html.includes('shopifyanalytics') || /\/products?\//i.test(lowerUrl)) return 'Shopify';
        if (html.includes('/dw/image/v2/') || html.includes('/on/demandware.store/') || html.includes('demandware') || html.includes('product-catalog')) return 'Salesforce Commerce Cloud';
        if (html.includes('woocommerce-product-gallery') || html.includes('wp-content/plugins/woocommerce') || html.includes('wc-ajax=')) return 'WooCommerce';
        if (html.includes('magento_catalog') || html.includes('x-magento-init') || html.includes('data-gallery-role') || html.includes('media/catalog/product')) return 'Magento';
        return '';
    }

    function productHintsFromUrl(targetUrl) {
        const hints = new Set();
        try {
            const parsed = new URL(targetUrl);
            const parts = parsed.pathname.split('/').filter(Boolean);
            const last = (parts[parts.length - 1] || '').replace(/\.[a-z0-9]+$/i, '');

            [last, ...parts].forEach(part => {
                const clean = part.replace(/\.[a-z0-9]+$/i, '');
                const skuMatches = clean.match(/[a-z]{2,}\d{2,}[a-z0-9]*/gi) || [];
                skuMatches.forEach(sku => {
                    const lower = sku.toLowerCase();
                    hints.add(lower);
                    const prefix = lower.match(/^[a-z]+\d+/);
                    if (prefix) hints.add(prefix[0]);
                });
            });
        } catch { }
        return [...hints].filter(h => h.length >= 4);
    }

    function imagePriority(url, baseUrl) {
        const lower = safeDecodeLower(url);
        let score = 0;

        productHintsFromUrl(baseUrl).forEach(hint => {
            if (lower.includes(hint)) score += /\d/.test(hint) ? 120 : 25;
        });
        score += productHintMatchScore(url);

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

    function getFilename(url) {
        try {
            if (url.startsWith('data:')) return 'image.png';
            const p = new URL(url).pathname;
            const base = p.split('/').pop();
            return base && base.length > 1 ? decodeURIComponent(base) : 'image';
        } catch { return 'image'; }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatBytes(bytes) {
        if (!bytes || bytes <= 0) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function scanTextForCommerceImages(text, add) {
        if (!text) return;
        const patterns = [
            /https?:\\?\/\\?\/[^"'\s<>]+(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^"'\s<>]*)?/gi,
            /https?:\\?\/\\?\/[^"'\s<>]+\/dw\/image\/v2\/[^"'\s<>]+/gi,
            /\\?\/[^"'\s<>]*(?:media\/catalog\/product|product-catalog|master-product-catalog)[^"'\s<>]+(?:jpg|jpeg|png|webp|avif)?(?:\?[^"'\s<>]*)?/gi,
        ];

        patterns.forEach(re => {
            let match;
            while ((match = re.exec(text)) !== null) {
                const cleaned = match[0].replace(/\\\//g, '/').replace(/\\u0026/g, '&');
                add(cleaned);
            }
        });
    }

    // ══════════════════════════════════════════
    //  Extract images from HTML
    // ══════════════════════════════════════════
    function extractImages(html, baseUrl) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        pageTitle = doc.querySelector('title')?.textContent?.trim() || 
                    doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || 
                    'images';
        // Sanitize for filename
        pageTitle = pageTitle.replace(/[\\\\/:*?"<>|]/g, '-').trim() || 'images';
        currentDomainPreset = doc.querySelector('meta[name="scraper-domain-preset"]')?.getAttribute('content')?.trim() || 
                              detectDomainPresetFromPage(baseUrl, doc);
        currentProductHints = collectProductHints(baseUrl, doc);

        // Map: canonical URL → best srcset candidate width
        const urlMap = new Map();

        const add = (url, width = 0) => {
            if (!url || typeof url !== 'string') return;
            url = url.trim();
            if (!url || url === 'about:blank' || url.startsWith('javascript:')) return;
            const resolved = resolveUrl(baseUrl, url);
            if (!resolved || !isImageUrl(resolved)) return;
            if (!urlMap.has(resolved) || width > urlMap.get(resolved)) {
                urlMap.set(resolved, width);
            }
        };

        const parseSrcset = (srcset) => {
            if (!srcset) return;
            srcset.split(',').forEach(part => {
                const pieces = part.trim().split(/\s+/);
                const s = pieces[0];
                const w = pieces[1] ? parseInt(pieces[1]) : 0;
                if (s) add(s, w);
            });
        };

        // ── 1. <img> — all possible src/data attributes ──
        const IMG_DATA_ATTRS = [
            'src', 'data-src', 'data-lazy-src', 'data-original', 'data-url',
            'data-image', 'data-img', 'data-full', 'data-full-size', 'data-large',
            'data-large-image', 'data-zoom', 'data-zoom-image', 'data-zoom-src',
            'data-hi-res', 'data-hires', 'data-retina', 'data-2x',
            'data-gallery', 'data-gallery-src', 'data-slide', 'data-photo',
            'data-master', 'data-echo', 'data-lazyload', 'data-lazy',
            'data-normal', 'data-big', 'data-origin', 'data-actualsrc',
            'data-thumb', 'data-large_image', 'data-o_src', 'data-o_href',
            'data-full-image', 'data-original-image', 'data-main-image',
        ];

        doc.querySelectorAll('img').forEach(el => {
            IMG_DATA_ATTRS.forEach(attr => {
                const val = el.getAttribute(attr);
                if (val) add(val);
            });
            parseSrcset(el.getAttribute('srcset') || el.getAttribute('data-srcset') || el.getAttribute('data-lazy-srcset') || '');
        });

        // ── 2. <noscript> img tags (lazy-load fallbacks) ──
        doc.querySelectorAll('noscript').forEach(el => {
            const inner = el.innerHTML || el.textContent || '';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = inner;
            tempDiv.querySelectorAll('img').forEach(img => {
                IMG_DATA_ATTRS.forEach(attr => {
                    const val = img.getAttribute(attr);
                    if (val) add(val);
                });
            });
        });

        // ── 3. <meta> OG / Twitter / schema ──
        doc.querySelectorAll('meta').forEach(el => {
            const prop = el.getAttribute('property') || el.getAttribute('name') || '';
            const content = el.getAttribute('content') || '';
            if (!content) return;
            if (/og:image|twitter:image|image_src/i.test(prop)) add(content);
        });

        // ── 4. <source srcset> in <picture> ──
        doc.querySelectorAll('source[srcset], source[data-srcset]').forEach(el => {
            parseSrcset(el.getAttribute('srcset') || el.getAttribute('data-srcset') || '');
        });

        // ── 5. <a href> pointing to image files ──
        doc.querySelectorAll('a[href]').forEach(el => {
            const href = el.getAttribute('href') || '';
            if (isImageUrl(href)) add(href);
            // data-* on <a> (e.g. lightbox links)
            ['data-src', 'data-image', 'data-full', 'data-zoom', 'data-large', 'data-gallery'].forEach(attr => {
                const val = el.getAttribute(attr);
                if (val) add(val);
            });
        });

        // ── 6. Any element with data-* image attributes (divs, spans, etc.) ──
        const GENERIC_DATA_ATTRS = [
            'data-src', 'data-image', 'data-img', 'data-full', 'data-large',
            'data-zoom', 'data-zoom-image', 'data-gallery', 'data-photo',
            'data-background', 'data-bg', 'data-lazy', 'data-echo',
            'data-original', 'data-url', 'data-slide-image',
            'data-thumb', 'data-large_image', 'data-o_src', 'data-o_href',
            'data-full-image', 'data-original-image', 'data-main-image',
        ];
        GENERIC_DATA_ATTRS.forEach(attr => {
            doc.querySelectorAll('[' + attr + ']').forEach(el => {
                const val = el.getAttribute(attr);
                if (val) add(val);
            });
        });

        // ── 7. Inline style background-image ──
        doc.querySelectorAll('[style]').forEach(el => {
            const style = el.getAttribute('style') || '';
            const matches = style.match(/url\(['"]?([^'")\s]+)['"]?\)/gi) || [];
            matches.forEach(m => {
                const inner = m.replace(/url\(['"]?/i, '').replace(/['"]?\)$/, '');
                if (inner) add(inner);
            });
        });

        // ── 8. <style> tag CSS background-image ──
        doc.querySelectorAll('style').forEach(el => {
            const css = el.textContent || '';
            const matches = css.match(/url\(['"]?([^'")\s]+)['"]?\)/g) || [];
            matches.forEach(m => {
                const inner = m.replace(/url\(['"]?/i, '').replace(/['"]?\)$/, '');
                if (inner && isImageUrl(inner)) add(inner);
            });
        });

        // ── 9. JSON-LD structured data (Product, ImageGallery, etc.) ──
        doc.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
            try {
                const data = JSON.parse(el.textContent || '');
                extractFromJsonLd(data, add);
            } catch (e) { /* ignore parse errors */ }
        });

        // ── 10. Scan <script> tags for image URL patterns ──
        doc.querySelectorAll('script:not([src])').forEach(el => {
            const text = el.textContent || '';
            // Match quoted image URLs (https://...jpg/png/gif/webp/svg/avif)
            const imgUrlRe = /["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^"'\s]*)?)/gi;
            let m;
            while ((m = imgUrlRe.exec(text)) !== null) {
                add(m[1]);
            }
            // Also match relative paths like "/images/photo.jpg"
            const relRe = /["'](\/[^"'\s]*\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^"'\s]*)?)/gi;
            while ((m = relRe.exec(text)) !== null) {
                add(m[1]);
            }
            scanTextForCommerceImages(text, add);
        });

        // ── 11. <video poster> ──
        doc.querySelectorAll('video[poster]').forEach(el => {
            const poster = el.getAttribute('poster');
            if (poster) add(poster);
        });

        return [...urlMap.keys()]
            .map((url, index) => ({ url, index, score: imagePriority(url, baseUrl) }))
            .sort((a, b) => (b.score - a.score) || (a.index - b.index))
            .map(item => item.url);
    }

    // Recursively extract image URLs from JSON-LD objects
    function extractFromJsonLd(data, add) {
        if (!data) return;
        if (typeof data === 'string') {
            if (isImageUrl(data)) add(data);
            return;
        }
        if (Array.isArray(data)) {
            data.forEach(item => extractFromJsonLd(item, add));
            return;
        }
        if (typeof data === 'object') {
            // Common JSON-LD image fields
            const imageFields = ['image', 'thumbnail', 'thumbnailUrl', 'contentUrl', 'url', 'logo', 'photo', 'primaryImageOfPage'];
            imageFields.forEach(field => {
                if (data[field]) extractFromJsonLd(data[field], add);
            });
            // Recurse into all values
            Object.values(data).forEach(val => {
                if (typeof val === 'object') extractFromJsonLd(val, add);
            });
        }
    }



    // ══════════════════════════════════════════
    //  Min-size filter (load image to check dimensions)
    // ══════════════════════════════════════════
    let dimensionCache = {}; // url → { w, h } | null

    async function filterByMinSize(urls, minPx) {
        const results = await Promise.all(urls.map(url => new Promise(resolve => {
            if (url.startsWith('data:')) { resolve(url); return; }
            // Use cached dimensions if available
            if (dimensionCache[url] !== undefined) {
                const d = dimensionCache[url];
                resolve(!d || minPx <= 0 || d.w >= minPx || d.h >= minPx ? url : null);
                return;
            }
            const img = new Image();
            const timer = setTimeout(() => { dimensionCache[url] = null; resolve(url); }, 4000);
            img.onload = () => {
                clearTimeout(timer);
                dimensionCache[url] = { w: img.naturalWidth, h: img.naturalHeight };
                resolve(minPx <= 0 || img.naturalWidth >= minPx || img.naturalHeight >= minPx ? url : null);
            };
            img.onerror = () => { clearTimeout(timer); dimensionCache[url] = null; resolve(url); };
            img.src = url;
        })));
        return results.filter(Boolean);
    }

    // ══════════════════════════════════════════
    //  Fetch file sizes (HEAD requests)
    // ══════════════════════════════════════════
    async function fetchFileSizes(urls) {
        await Promise.all(urls.map(async url => {
            if (fileSizeCache[url] !== undefined) return;
            try {
                // Try HEAD first
                let resp = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });

                // If Method Not Allowed (405) or strict CORS, try GET with immediate abort
                if (!resp.ok && resp.status === 405) {
                    const controller = new AbortController();
                    resp = await fetch(url, {
                        method: 'GET',
                        signal: controller.signal
                    });
                    controller.abort(); // Abort body download immediately, we only need headers
                }

                if (resp.body) await resp.body.cancel(); // ensure body is closed

                const cl = resp.headers.get('content-length');
                fileSizeCache[url] = cl ? formatBytes(parseInt(cl)) : '';
            } catch (e) {
                fileSizeCache[url] = '';
            }
        }));
    }

    sortSelect.addEventListener('change', applyFiltersAndSort);
    minSizeInput.addEventListener('change', () => {
        applyFiltersAndSort();
    });

    function applyFiltersAndSort() {
        const minPx = parseInt(minSizeInput.value) || 0;

        let filtered = allImages.filter(url => {
            // Min-size filter (uses cached dimensions)
            if (minPx > 0) {
                const d = dimensionCache[url];
                if (d !== undefined && d !== null) {
                    if (d.w < minPx && d.h < minPx) return false;
                }
                // If not cached yet, keep the image (will be filtered after load)
            }
            return true;
        });

        // Sort
        const sort = sortSelect.value;
        if (sort === 'name-asc') {
            filtered.sort((a, b) => getFilename(a).localeCompare(getFilename(b)));
        } else if (sort === 'name-desc') {
            filtered.sort((a, b) => getFilename(b).localeCompare(getFilename(a)));
        } else if (sort === 'size-desc') {
            filtered.sort((a, b) => {
                const sa = parseSizeStr(fileSizeCache[a] || '');
                const sb = parseSizeStr(fileSizeCache[b] || '');
                return sb - sa;
            });
        } else if (sort === 'size-asc') {
            filtered.sort((a, b) => {
                const sa = parseSizeStr(fileSizeCache[a] || '');
                const sb = parseSizeStr(fileSizeCache[b] || '');
                return sa - sb;
            });
        }

        displayImages = filtered;
        renderGrid(filtered);

        // Update filtered count label
        if (filtered.length < allImages.length) {
            filteredNum.textContent = filtered.length;
            filteredCount.classList.remove('hidden');
        } else {
            filteredCount.classList.add('hidden');
        }

        noFilterState.classList.toggle('hidden', filtered.length > 0 || allImages.length === 0);
        imageGrid.classList.toggle('hidden', filtered.length === 0);
    }

    function parseSizeStr(str) {
        if (!str) return 0;
        const m = str.match(/([\d.]+)\s*(B|KB|MB)/i);
        if (!m) return 0;
        const n = parseFloat(m[1]);
        const u = m[2].toUpperCase();
        if (u === 'MB') return n * 1024 * 1024;
        if (u === 'KB') return n * 1024;
        return n;
    }

    // ══════════════════════════════════════════
    //  Render Grid
    // ══════════════════════════════════════════
    function renderGrid(images) {
        imageGrid.innerHTML = '';
        images.forEach((imgUrl, i) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            if (selectedUrls.has(imgUrl)) card.classList.add('selected');
            card.style.animationDelay = `${Math.min(i * 20, 400)}ms`;
            const filename = getFilename(imgUrl);
            const ext = getExtension(imgUrl);
            const isGif = ext === 'gif';
            const sizeStr = fileSizeCache[imgUrl] || '';

            card.innerHTML = `
        <div class="image-thumb-wrap">
          <div class="select-check">✓</div>
          ${isGif ? '<span class="gif-badge">GIF</span>' : ''}
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(filename)}" loading="lazy" />
          <div class="img-overlay">
            <button class="img-overlay-btn" data-action="preview"><i data-lucide="zoom-in" class="icon"></i> გადიდება</button>
          </div>
        </div>
        <div class="image-card-footer">
          <div class="image-card-meta">
            <div class="image-name-row">
              <span class="image-name" title="${escapeHtml(filename)}">${escapeHtml(filename)}</span>
              ${ext ? `<span class="ext-badge">${escapeHtml(ext.toUpperCase())}</span>` : ''}
            </div>
            ${sizeStr ? `<span class="image-size-badge">${escapeHtml(sizeStr)}</span>` : '<span class="image-size-badge" data-size-placeholder></span>'}
          </div>
          <div class="card-actions">
            <button class="copy-url-btn" data-action="copy" title="URL კოპირება"><i data-lucide="copy" class="icon"></i></button>
            <button class="download-btn" data-action="download" title="გადმოწერა (სწორი ფორმატით)"><i data-lucide="download" class="icon"></i></button>
          </div>
        </div>
      `;

            const img = card.querySelector('img');

            // GIF: pause on load, play on hover
            if (isGif) {
                img.addEventListener('load', () => {
                    // Store the gif src
                });
            }

            img.addEventListener('error', () => {
                card.querySelector('.image-thumb-wrap').innerHTML = `
          <div class="image-broken">
            <span class="broken-icon">🚫</span>
            <span>ვერ ჩაიტვირთა</span>
          </div>`;
            });

            // Thumbnail click → select/deselect
            card.querySelector('.image-thumb-wrap').addEventListener('click', e => {
                if (e.target.closest('[data-action="preview"]')) return;
                toggleSelect(imgUrl, card);
            });

            // Preview button → lightbox
            card.querySelector('[data-action="preview"]').addEventListener('click', e => {
                e.stopPropagation();
                const idx = displayImages.indexOf(imgUrl);
                openLightbox(idx >= 0 ? idx : 0);
            });

            // Copy URL
            card.querySelector('[data-action="copy"]').addEventListener('click', e => {
                e.stopPropagation();
                copyToClipboard(imgUrl);
            });

            // Smart Download
            card.querySelector('[data-action="download"]').addEventListener('click', e => {
                e.stopPropagation();
                downloadImage(imgUrl, filename, e.currentTarget);
            });

            imageGrid.appendChild(card);
        });

        // Lazy-load file sizes for visible cards
        fetchFileSizes(images.slice(0, 40)).then(() => {
            // Update size badges already in DOM
            images.slice(0, 40).forEach(url => {
                const sizeStr = fileSizeCache[url];
                if (!sizeStr) return;
                const cards = imageGrid.querySelectorAll('.image-card');
                cards.forEach(card => {
                    const img = card.querySelector('img');
                    if (img && img.src === url) {
                        const placeholder = card.querySelector('[data-size-placeholder]');
                        if (placeholder) {
                            placeholder.textContent = sizeStr;
                            placeholder.removeAttribute('data-size-placeholder');
                        }
                    }
                });
            });
        });
        refreshIcons();
    }

    function getProxiedUrl(imgUrl) {
        if (location.protocol === 'file:') return `https://corsproxy.io/?${encodeURIComponent(imgUrl)}`;
        if (location.hostname.includes('netlify.app')) return `/.netlify/functions/proxy?url=${encodeURIComponent(imgUrl)}`;
        return `/proxy?url=${encodeURIComponent(imgUrl)}`;
    }

    async function fetchImageBlob(url) {
        if (url.startsWith('data:')) {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('Data URI fetch failed');
            return await resp.blob();
        }

        const primaryProxy = getProxiedUrl(url);
        try {
            const resp = await fetch(primaryProxy, { signal: AbortSignal.timeout(15000) });
            if (resp.ok) return await resp.blob();
        } catch (e) {
            console.warn('Primary proxy failed, trying fallback', e);
        }

        try {
            const fallbackProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const resp2 = await fetch(fallbackProxy, { signal: AbortSignal.timeout(15000) });
            if (resp2.ok) return await resp2.blob();
        } catch (e) {
            console.warn('Fallback proxy failed', e);
        }

        try {
            // Ultimate fallback (corsproxy.io)
            const proxy3 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const resp3 = await fetch(proxy3, { signal: AbortSignal.timeout(15000) });
            if (resp3.ok) return await resp3.blob();
        } catch (e) {}

        throw new Error('All proxy attempts failed for ' + url);
    }

    async function downloadImage(url, filename, btn) {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="icon spin-icon"></i>';
        refreshIcons();
        btn.disabled = true;

        try {
            // 1. Fetch as Blob to get real MIME type through proxy to avoid CORS
            const blob = await fetchImageBlob(url);

            // 2. Detect Ext from MIME
            const mime = blob.type; // e.g. image/webp
            let ext = mime.split('/')[1];
            if (ext === 'jpeg') ext = 'jpg';
            if (ext === 'svg+xml') ext = 'svg';
            if (!ext) ext = 'jpg'; // fallback

            // 3. Fix filename extension
            // Remove existing extension if any
            let dName = filename.replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico|avif)$/i, '');
            // Append correct extension (avoid double dot)
            dName = dName + '.' + ext;

            // 4. Save
            saveAs(blob, dName);
            showToast(`✅ გადმოიწერა: ${dName}`);
        } catch (err) {
            console.error('Download failed', err);
            // Fallback: open in new tab
            window.open(url, '_blank');
        } finally {
            btn.innerHTML = originalHtml;
            refreshIcons();
            btn.disabled = false;
        }
    }

    // ══════════════════════════════════════════
    //  Clipboard
    // ══════════════════════════════════════════
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 URL კოპირებულია!');
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('📋 URL კოპირებულია!');
        });
    }

    // ══════════════════════════════════════════
    //  Lightbox
    // ══════════════════════════════════════════
    function openLightbox(index) {
        lightboxIndex_val = index;
        const url = displayImages[index];
        if (!url) return;

        lightboxImg.src = url;
        lightboxUrl.textContent = url;
        lightboxFileSize.textContent = fileSizeCache[url] || '';
        lightboxIndex.textContent = `${index + 1} / ${displayImages.length}`;
        lightboxDownload.href = url;
        lightboxDownload.download = getFilename(url);

        // Show extension immediately
        const ext = getExtension(url).toUpperCase() || '?';
        lightboxResolution.textContent = ext;

        // Nav arrows visibility
        lightboxPrev.style.display = displayImages.length > 1 ? 'flex' : 'none';
        lightboxNext.style.display = displayImages.length > 1 ? 'flex' : 'none';

        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Get natural dimensions — append after extension
        const tempImg = new Image();
        tempImg.onload = () => {
            if (tempImg.naturalWidth && tempImg.naturalHeight) {
                lightboxResolution.textContent = `${ext}  ·  ${tempImg.naturalWidth} × ${tempImg.naturalHeight} px`;
            }
        };
        tempImg.src = url;

        // Fetch file size if not cached
        if (!fileSizeCache[url]) {
            fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
                .then(r => {
                    const cl = r.headers.get('content-length');
                    if (cl) {
                        const s = formatBytes(parseInt(cl));
                        fileSizeCache[url] = s;
                        lightboxFileSize.textContent = s;
                    }
                }).catch(() => { });
        }
    }

    function closeLightbox() {
        lightbox.classList.add('hidden');
        lightboxImg.src = '';
        document.body.style.overflow = '';
    }

    function lightboxNavigate(dir) {
        const next = lightboxIndex_val + dir;
        if (next < 0 || next >= displayImages.length) return;
        openLightbox(next);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxBackdrop.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => lightboxNavigate(-1));
    lightboxNext.addEventListener('click', () => lightboxNavigate(1));
    lightboxCopy.addEventListener('click', () => copyToClipboard(displayImages[lightboxIndex_val]));

    document.addEventListener('keydown', e => {
        if (lightbox.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lightboxNavigate(-1);
        if (e.key === 'ArrowRight') lightboxNavigate(1);
    });

    // ══════════════════════════════════════════
    //  Show results
    // ══════════════════════════════════════════
    function showResults(images) {
        initialState.classList.add('hidden');
        clearStatus();

        if (images.length === 0) {
            controlsBar.classList.add('hidden');
            resultsHeader.classList.add('hidden');
            imageGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        noFilterState.classList.add('hidden');
        imageCount.textContent = images.length;
        controlsBar.classList.remove('hidden');
        resultsHeader.classList.remove('hidden');
        applyFiltersAndSort();
    }

    // ══════════════════════════════════════════
    //  Download All / Selected as ZIP
    // ══════════════════════════════════════════
    downloadAllBtn.addEventListener('click', async () => {
        const toDownload = selectedUrls.size > 0 ? [...selectedUrls] : displayImages;
        if (!toDownload.length) return;

        const label = selectedUrls.size > 0 ? `${selectedUrls.size} მონიშნული` : 'ყველა';
        downloadAllBtn.disabled = true;
        downloadAllBtn.innerHTML = '<i data-lucide="loader-2" class="icon spin-icon"></i> მიმდინარეობს...';
        refreshIcons();
        showToast(`📦 ZIP იქმნება (${label})...`, 15000);

        try {
            const zipName = pageTitle === 'images' ? 'images' : pageTitle;
            const zip = new JSZip();
            const folder = zip.folder(zipName);
            const usedNames = {};
            let successCount = 0;

            await Promise.all(toDownload.map(async url => {
                try {
                    const blob = await fetchImageBlob(url);

                    let name = getFilename(url);
                    // Detected MIME
                    let ext = (blob.type || '').split('/')[1] || '';
                    if (ext === 'jpeg') ext = 'jpg';
                    if (ext === 'svg+xml') ext = 'svg';

                    if (ext) {
                        // Replace existing extension or add new one
                        name = name.replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico|avif)$/i, '');
                        name += '.' + ext;
                    } else if (!name.includes('.')) {
                        name += '.jpg'; // default
                    }

                    if (usedNames[name]) {
                        usedNames[name]++;
                        const parts = name.split('.');
                        const e = parts.pop();
                        name = `${parts.join('.')}_${usedNames[name]}.${e}`;
                    } else {
                        usedNames[name] = 1;
                    }
                    folder.file(name, blob);
                    successCount++;
                } catch (err) {
                    console.error('Failed to download for zip:', url, err);
                }
            }));

            if (successCount === 0) {
                throw new Error('No files successfully downloaded');
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${zipName}.zip`);
            showToast('✅ ZIP გადმოწერილია!');
        } catch (e) {
            console.error(e);
            showToast('❌ ფოტოების გადმოწერა ვერ მოხერხდა');
        } finally {
            downloadAllBtn.disabled = false;
            downloadAllBtn.innerHTML = `<i data-lucide="download" class="icon"></i> <span id="downloadBtnLabel">${selectedUrls.size > 0 ? 'გადმოწერა (' + selectedUrls.size + ')' : 'ყველას გადმოწერა'}</span>`;
            refreshIcons();
        }
    });

    // ══════════════════════════════════════════
    //  Export URLs as .txt
    // ══════════════════════════════════════════
    exportUrlsBtn.addEventListener('click', () => {
        const urls = selectedUrls.size > 0 ? [...selectedUrls] : displayImages;
        if (!urls.length) return;
        const content = urls.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'image-urls.txt');
        showToast(`📋 ${urls.length} URL ექსპორტირებულია`);
    });

    // ══════════════════════════════════════════
    //  Clear
    // ══════════════════════════════════════════
    clearBtn.addEventListener('click', () => {
        resetUI();
        urlInput.value = '';
        urlInput.focus();
    });

    // ══════════════════════════════════════════
    //  Scrape
    // ══════════════════════════════════════════
    function smartDeduplicate(urls) {
        const unique = new Map();
        urls.forEach(url => {
            try {
                const u = new URL(url);
                // Key: hostname + pathname (ignore query params for base dedupe)
                // Exception: if path ends with generic name like "image.jpg", maybe query is important?
                // For now, let's treat query params as variants.
                const key = (u.hostname + u.pathname).toLowerCase();

                if (!unique.has(key)) {
                    unique.set(key, url);
                } else {
                    const existing = unique.get(key);
                    // Heuristic: prefer "large", "2x", "hires"
                    const getScore = (str) => {
                        let s = 0;
                        const lower = str.toLowerCase();
                        if (lower.includes('large')) s += 10;
                        if (lower.includes('2x')) s += 10;
                        if (lower.includes('hires') || lower.includes('high')) s += 10;
                        if (lower.includes('zoom')) s += 5;
                        if (lower.includes('thumb')) s -= 10;
                        if (lower.includes('small')) s -= 5;
                        return s;
                    };
                    const scoreNew = getScore(url);
                    const scoreOld = getScore(existing);

                    if (scoreNew > scoreOld) {
                        unique.set(key, url);
                    } else if (scoreNew === scoreOld) {
                        // If scores equal, prefer the one with *more* query params? Or *fewer*?
                        // Often cleaner URL is better.
                        if (url.length < existing.length) unique.set(key, url);
                    }
                }
            } catch { }
        });
        return Array.from(unique.values());
    }

    async function scrape() {
        let url = urlInput.value.trim();
        if (!url) { urlInput.focus(); return; }
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        clearStatus();
        showLoading(true);
        initialState.classList.add('hidden');
        controlsBar.classList.add('hidden');
        resultsHeader.classList.add('hidden');
        emptyState.classList.add('hidden');
        noFilterState.classList.add('hidden');
        imageGrid.innerHTML = '';
        allImages = [];
        displayImages = [];
        currentSourceUrl = url;
        currentProductHints = [];
        currentDomainPreset = '';
        selectedUrls.clear();
        fileSizeCache = {};
        dimensionCache = {};
        updateSelectionUI();
        scrapeBtn.disabled = true;

        try {
            const html = await fetchHtml(url);
            fetchApiLimits(); // Refresh credits in background
            const raw = extractImages(html, url);

            // Deduplicate
            const deduped = smartDeduplicate(raw);

            // Filter by min size
            const minPx = parseInt(minSizeInput.value) || 0;
            const filtered = await filterByMinSize(deduped, minPx);

            allImages = filtered;
            addToHistory(url);
            showResults(filtered);

            if (filtered.length > 0) {
                const statusCount = `${filtered.length} სურათი`;
                const presetText = currentDomainPreset ? ` • Preset: ${currentDomainPreset}` : '';
                setStatus(`✅ ${statusCount} ნაპოვნია (${raw.length - filtered.length} პატარა გაფილტრულია)${presetText}`, 'success');
                // Kick off file size + content-type fetching in background, then refresh filters
                fetchFileSizes(filtered.slice(0, 80)).then(() => {
                    applyFiltersAndSort();
                });
            }
        } catch (err) {
            initialState.classList.remove('hidden');
            setStatus('❌ ' + (err.message || 'უცნობი შეცდომა'), 'error');
        } finally {
            showLoading(false);
            scrapeBtn.disabled = false;
        }
    }

    scrapeBtn.addEventListener('click', scrape);
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') scrape(); });
    // Auto-scrape when user pastes a URL
    urlInput.addEventListener('paste', () => {
        setTimeout(() => { if (urlInput.value.trim()) scrape(); }, 50);
    });
    fetchApiLimits();
    urlInput.focus();
})();
