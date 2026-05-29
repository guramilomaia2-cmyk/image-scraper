// Test Ray-Ban PDP JSON API to get all product image data
const axios = require('axios');

const SCRAPER_API_KEY = 'ac99f58a039f20b3b48f1575906bef8d';

// The product data tells us: moCo = "0RW4006__601S1M"
// Ray-Ban exposes a WCS REST API for product catalog images
// Known API patterns:
// https://www.ray-ban.com/wcs/resources/store/33152/productview/bySkuId?currency=AUD&storeId=33152&langId=-47&catentryId=463477
// https://images.ray-ban.com/is/image/RayBan/0RW4006__601S1M?$RB_Product$

const catEntryId = '463477'; // from the static HTML
const storeId = '33152';
const moCo = '0RW4006__601S1M';

async function fetchViaScraperAPI(url) {
  const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=au`;
  const res = await axios.get(apiUrl, { timeout: 30000 });
  return res.data;
}

async function main() {
  // Test 1: Try the WCS product REST API
  console.log('Test 1: WCS product REST API...');
  try {
    const url = `https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/bySkuId?currency=AUD&storeId=${storeId}&langId=-47&catentryId=${catEntryId}`;
    const data = await fetchViaScraperAPI(url);
    console.log('Success! Type:', typeof data);
    if (typeof data === 'object') {
      console.log('Keys:', Object.keys(data).join(', '));
      console.log('Full response:');
      console.log(JSON.stringify(data, null, 2).substring(0, 3000));
    } else {
      console.log('Response:', String(data).substring(0, 1000));
    }
  } catch (err) {
    console.log('Failed:', err.message);
  }

  // Test 2: Try the Scene7/IS API for image list
  console.log('\nTest 2: Scene7 image set API...');
  try {
    const url = `https://images.ray-ban.com/is/image/RayBan/${moCo}?req=set,json&id=rb`;
    const data = await fetchViaScraperAPI(url);
    console.log('Success!');
    console.log('Type:', typeof data);
    console.log(String(data).substring(0, 2000));
  } catch (err) {
    console.log('Failed:', err.message);
  }

  // Test 3: Direct Ray-Ban CDN image gallery API
  console.log('\nTest 3: cdn-record-files product images API...');
  try {
    const url = `https://www.ray-ban.com/wcs/resources/store/${storeId}/pdp/getImageSet?moCo=${encodeURIComponent(moCo)}&storeId=${storeId}`;
    const data = await fetchViaScraperAPI(url);
    console.log('Success!');
    console.log(String(data).substring(0, 2000));
  } catch (err) {
    console.log('Failed:', err.message);
  }

  // Test 4: Luxottica product images API
  console.log('\nTest 4: Luxottica CDN product image API...');
  try {
    const url = `https://images2.ray-ban.com/is/image/RayBan/${moCo}?req=imageset,json`;
    const data = await fetchViaScraperAPI(url);
    console.log('Success!');
    console.log(String(data).substring(0, 2000));
  } catch (err) {
    console.log('Failed:', err.message);
  }
}

main();
