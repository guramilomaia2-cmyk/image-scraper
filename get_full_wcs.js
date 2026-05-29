// Use the basic byId endpoint (which worked) to get all data about the product
// Then parse the full JSON response and find all image URLs
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const storeId = '33152';
const langId = '-47';
const baseUrl = 'https://www.ray-ban.com';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-AU,en;q=0.9',
  'Referer': 'https://www.ray-ban.com/australia/electronics/RW4006ray-ban%20meta%20wayfarer%20-%20gen%201-black/8056262326831',
};

// The basic byId (without profile) worked and returned thumbnail URL
// Let's get the full JSON and examine all the image fields
async function main() {
  const catEntryId = '463477';
  
  console.log('Fetching full productview byId response...');
  try {
    const url = `${baseUrl}/wcs/resources/store/${storeId}/productview/byId/${catEntryId}?currency=AUD&langId=${langId}`;
    const res = await axios.get(url, { timeout: 20000, headers });
    const data = res.data;
    
    // Save full response
    fs.writeFileSync(path.join(__dirname, 'wcs-product.json'), JSON.stringify(data, null, 2));
    console.log('Saved to wcs-product.json');
    
    // Find all image fields
    const images = new Set();
    const findImages = (obj, path = '') => {
      if (typeof obj === 'string') {
        if (obj.includes('ray-ban.com') && (obj.includes('.jpg') || obj.includes('.png') || obj.includes('.webp') || obj.includes('.gif'))) {
          images.add(obj);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => findImages(item, `${path}[${i}]`));
      } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(k => findImages(obj[k], `${path}.${k}`));
      }
    };
    
    findImages(data);
    console.log('\nAll image URLs found:');
    [...images].forEach(img => console.log(' -', img));
    
    // Also show the entry keys
    const entry = data.CatalogEntryView?.[0];
    if (entry) {
      console.log('\nEntry keys:', Object.keys(entry).join(', '));
      console.log('\nEntire entry:');
      console.log(JSON.stringify(entry, null, 2));
    }
  } catch (err) {
    console.log('Failed:', err.message);
  }
  
  // Also try to get the actual gallery images from the WCS catalog
  // Try different product IDs (the color variants) 
  console.log('\n\nTrying to find related SKUs via search...');
  try {
    const url = `${baseUrl}/wcs/resources/store/${storeId}/productview/bySearchTerm/RW4006?currency=AUD&langId=${langId}&pageSize=50`;
    const res = await axios.get(url, { timeout: 20000, headers });
    console.log('Search status:', res.status);
    const data = res.data;
    if (data.CatalogEntryView) {
      console.log('Results:', data.CatalogEntryView.length);
      data.CatalogEntryView.forEach((item, i) => {
        console.log(`  ${i}: ID=${item.uniqueID}, thumbnail=${item.thumbnail}`);
      });
    } else {
      console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    }
  } catch (err) {
    console.log('Search failed:', err.message);
  }
}

main();
