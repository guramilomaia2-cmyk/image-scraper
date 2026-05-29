// Use WCS REST API to get ALL product color variants and their images
const axios = require('axios');

const storeId = '33152';
const langId = '-47';
const catalogId = '22561';
const parentProductId = '466489'; // parentProductID from previous response
const catEntryId = '463477'; // current item

const baseUrl = 'https://www.ray-ban.com';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-AU,en;q=0.9',
  'Referer': 'https://www.ray-ban.com/australia/electronics/RW4006ray-ban%20meta%20wayfarer%20-%20gen%201-black/8056262326831',
};

async function main() {
  // Step 1: Get the parent product with all variants
  console.log('Fetching parent product with all variants...');
  try {
    const url = `${baseUrl}/wcs/resources/store/${storeId}/productview/byId/${parentProductId}?currency=AUD&langId=${langId}&profileName=IBM_Store_EntitledItemListDetailed`;
    console.log('URL:', url);
    const res = await axios.get(url, { timeout: 20000, headers });
    const data = res.data;
    
    console.log('Status:', res.status);
    if (data.CatalogEntryView) {
      console.log('Items count:', data.CatalogEntryView.length);
      data.CatalogEntryView.forEach((item, i) => {
        console.log(`Item ${i}: ID=${item.uniqueID}, thumbnail=${item.thumbnail}`);
        if (item.components) {
          item.components.forEach(c => {
            console.log(`  Component: ID=${c.uniqueID}, thumbnail=${c.thumbnail}`);
          });
        }
      });
    } else {
      console.log('Keys:', Object.keys(data).join(', '));
      console.log(JSON.stringify(data, null, 2).substring(0, 3000));
    }
  } catch (err) {
    console.log('Parent product failed:', err.message);
  }

  // Step 2: Get all child items of parent product
  console.log('\n\nFetching child products by parent ID...');
  try {
    const url = `${baseUrl}/wcs/resources/store/${storeId}/productview/byParentProductId/${parentProductId}?currency=AUD&langId=${langId}`;
    console.log('URL:', url);
    const res = await axios.get(url, { timeout: 20000, headers });
    const data = res.data;
    
    console.log('Status:', res.status);
    console.log('Total items:', data.recordSetCount);
    if (data.CatalogEntryView) {
      console.log('Variants found:', data.CatalogEntryView.length);
      const images = [];
      data.CatalogEntryView.forEach((item, i) => {
        if (item.thumbnail) images.push(item.thumbnail);
        if (item.fullImage) images.push(item.fullImage);
        console.log(`Variant ${i}: ID=${item.uniqueID}, thumbnail=${item.thumbnail}`);
        // Check for additional images in attributes or other fields
        if (item.UserData) {
          console.log('  UserData:', JSON.stringify(item.UserData).substring(0, 200));
        }
      });
      console.log('\nAll images:');
      images.forEach(img => console.log(' -', img));
    } else {
      console.log(JSON.stringify(data, null, 2).substring(0, 3000));
    }
  } catch (err) {
    console.log('Child products failed:', err.message, err.response?.status);
  }

  // Step 3: Try the detailed profile
  console.log('\n\nFetching catentry with detailed profile...');
  try {
    const url = `${baseUrl}/wcs/resources/store/${storeId}/productview/byId/${catEntryId}?currency=AUD&langId=${langId}&profileName=IBM_Store_EntitledItemListDetailed`;
    console.log('URL:', url);
    const res = await axios.get(url, { timeout: 20000, headers });
    const data = res.data;
    const entry = data.CatalogEntryView?.[0];
    if (entry) {
      console.log('Entry keys:', Object.keys(entry).join(', '));
      // Look for all image fields
      const findImages = (obj, path = '') => {
        if (typeof obj === 'string' && (obj.includes('.jpg') || obj.includes('.png') || obj.includes('.webp'))) {
          console.log(`  ${path}: ${obj}`);
        } else if (Array.isArray(obj)) {
          obj.forEach((item, i) => findImages(item, `${path}[${i}]`));
        } else if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(k => findImages(obj[k], `${path}.${k}`));
        }
      };
      findImages(entry);
    }
  } catch (err) {
    console.log('Detailed failed:', err.message);
  }
}

main();
