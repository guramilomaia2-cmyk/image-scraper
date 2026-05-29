// Try to access the WCS API through ScraperAPI to bypass Akamai filtering
const axios = require('axios');
const fs = require('fs');

const SCRAPER_API_KEY = 'ac99f58a039f20b3b48f1575906bef8d';
const storeId = '33152';
const langId = '-47';
const catEntryId = '463477';
const parentProductId = '466489';

const wcsUrl = `https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/byId/${catEntryId}?currency=AUD&langId=${langId}`;

async function main() {
  // Test 1: ScraperAPI static (no JS)
  console.log('Test 1: ScraperAPI static for WCS API...');
  try {
    const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(wcsUrl)}&country_code=au`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    console.log('Status:', res.status, 'Length:', String(res.data).length);
    if (typeof res.data === 'object') {
      const json = JSON.stringify(res.data, null, 2);
      fs.writeFileSync('wcs-scraperapi.json', json);
      console.log('Saved to wcs-scraperapi.json');
      console.log(json.substring(0, 3000));
    } else {
      console.log(String(res.data).substring(0, 2000));
    }
  } catch (err) {
    console.log('Failed:', err.message);
  }
  
  // Test 2: Try byPartNumber instead (8056262326831)
  console.log('\nTest 2: WCS API by partNumber...');
  try {
    const url = `https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/byPartNumber/8056262326831?currency=AUD&langId=${langId}`;
    const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=au`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    console.log('Status:', res.status);
    if (typeof res.data === 'object') {
      const json = JSON.stringify(res.data, null, 2);
      console.log(json.substring(0, 3000));
    } else {
      console.log(String(res.data).substring(0, 2000));
    }
  } catch (err) {
    console.log('Failed:', err.message);
  }
  
  // Test 3: Try getting child items via byModelId  
  console.log('\nTest 3: byModelId...');
  try {
    // The Sku is RW4006, let's try fetching by that
    const url = `https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/byModelId/RW4006?currency=AUD&langId=${langId}`;
    const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=au`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    console.log('Status:', res.status);
    const data = res.data;
    if (data.CatalogEntryView) {
      console.log('Variants:', data.CatalogEntryView.length);
      data.CatalogEntryView.forEach((item, i) => {
        console.log(`  ${i}: ID=${item.uniqueID}, thumbnail=${item.thumbnail}`);
      });
    } else {
      console.log(String(res.data).substring(0, 2000));
    }
  } catch (err) {
    console.log('Failed:', err.message);
  }
}

main();
