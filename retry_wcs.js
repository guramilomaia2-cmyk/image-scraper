// The basic byId worked before without profileName. Let's try with exact same params.
const axios = require('axios');
const fs = require('fs');

const storeId = '33152';
const langId = '-47';
const catEntryId = '463477';

// Minimal headers (no Referer) - exactly what worked before
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

async function main() {
  try {
    const url = `https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/byId/${catEntryId}?currency=AUD&langId=${langId}`;
    console.log('Fetching:', url);
    const res = await axios.get(url, { timeout: 20000, headers });
    console.log('Status:', res.status);
    fs.writeFileSync('wcs-product.json', JSON.stringify(res.data, null, 2));
    console.log('Saved to wcs-product.json');
    
    // Print full JSON
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Failed:', err.message, err.response?.status);
    
    // Try without any custom headers (pure GET)
    try {
      console.log('\nTrying without headers...');
      const res2 = await axios.get(`https://www.ray-ban.com/wcs/resources/store/${storeId}/productview/byId/${catEntryId}?currency=AUD&langId=${langId}`, { timeout: 20000 });
      console.log('Success! Status:', res2.status);
      fs.writeFileSync('wcs-product.json', JSON.stringify(res2.data, null, 2));
      console.log(JSON.stringify(res2.data, null, 2).substring(0, 5000));
    } catch (err2) {
      console.log('Also failed:', err2.message, err2.response?.status);
    }
  }
}

main();
