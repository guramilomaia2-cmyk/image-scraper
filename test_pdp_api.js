// Try Ray-Ban's PDPCMSDynamicContent endpoint directly
// This is the XHR endpoint that provides all dynamic product data including images
const axios = require('axios');

const SCRAPER_API_KEY = 'ac99f58a039f20b3b48f1575906bef8d';

const catEntryId = '463477'; // from the static HTML
const storeId = '33152';
const langId = '-47';
const catalogId = '22561';

async function tryFetch(name, url, headers = {}) {
  console.log(`\nTrying: ${name}`);
  console.log('URL:', url);
  try {
    const res = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-AU,en;q=0.9',
        'Referer': 'https://www.ray-ban.com/australia/electronics/RW4006ray-ban%20meta%20wayfarer%20-%20gen%201-black/8056262326831',
        'Origin': 'https://www.ray-ban.com',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers
      }
    });
    console.log(`SUCCESS! Status: ${res.status}, Type: ${typeof res.data}, Length: ${String(res.data).length}`);
    if (typeof res.data === 'object') {
      const str = JSON.stringify(res.data, null, 2);
      console.log(str.substring(0, 2000));
    } else {
      console.log(String(res.data).substring(0, 2000));
    }
  } catch (err) {
    console.log(`FAILED: ${err.message} (${err.response?.status || 'no status'})`);
  }
}

async function tryViaScraperAPI(name, url) {
  console.log(`\nTrying via ScraperAPI: ${name}`);
  try {
    const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=au`;
    const res = await axios.get(apiUrl, { timeout: 20000 });
    console.log(`SUCCESS! Status: ${res.status}, Length: ${String(res.data).length}`);
    if (typeof res.data === 'object') {
      console.log(JSON.stringify(res.data, null, 2).substring(0, 2000));
    } else {
      console.log(String(res.data).substring(0, 2000));
    }
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
  }
}

async function main() {
  // 1. PDPCMSDynamicContent (the XHR that page intercepts)
  await tryFetch('PDPCMSDynamicContent',
    `https://www.ray-ban.com/PDPCMSDynamicContent?catalogId=${catalogId}&langId=${langId}&storeId=${storeId}&catentryId=${catEntryId}`);

  // 2. Another pattern
  await tryFetch('PDPCMSDynamicContent v2',
    `https://www.ray-ban.com/australia/PDPCMSDynamicContent?catalogId=${catalogId}&langId=${langId}&storeId=${storeId}&catentryId=${catEntryId}`);

  // 3. Product by catentry
  await tryFetch('Product by CatEntry WCS API',
    `https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/byId/${catEntryId}?currency=AUD&langId=${langId}`);

  // 4. Try getting PDPImagesSet  
  await tryViaScraperAPI('WCS Product Detail REST',
    `https://www.ray-ban.com/wcs/resources/store/${storeId}/pdpGallery/getImages?catentryId=${catEntryId}&langId=${langId}`);
  
  // 5. Try a known Luxottica endpoint format
  await tryFetch('Luxottica product catalog',
    `https://www.ray-ban.com/wcs/resources/store/${storeId}/pdp/getGalleryData?catentryId=${catEntryId}&storeId=${storeId}&langId=${langId}`);
}

main();
