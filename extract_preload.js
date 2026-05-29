// Extract preload images from <link> tags and find the moCo model code
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'rayban-static.html'), 'utf8');

// Find all preload image links
console.log('=== Link rel=preload as=image ===');
const preloadRegex = /<link[^>]+rel="preload"[^>]+as="image"[^>]+href="([^"]+)"[^>]*>/gi;
let m;
while ((m = preloadRegex.exec(html)) !== null) {
  console.log(' -', m[1]);
}

// Find the moCo value to use as base model code
console.log('\n=== moCo model codes in data ===');
const mocoMatches = html.match(/"moCo":"([^"]+)"/g) || [];
mocoMatches.forEach(m => console.log(' ', m));

// Find the groupKey
const groupKeyMatches = html.match(/"groupKey":"([^"]+)"/g) || [];
groupKeyMatches.forEach(m => console.log(' ', m));

// Let's look at the cdn-record-files structure 
console.log('\n=== cdn-record-files URLs ===');
const cdnRegex = /https?:\/\/images2?\.ray-ban\.com\/\/cdn-record-files[^"'\s<>]+/gi;
const cdnMatches = [...new Set(html.match(cdnRegex) || [])];
cdnMatches.forEach(u => console.log(' -', u));

// Find how images are loaded from the products JSON area 
console.log('\n=== Full productsJSON ===');
const start = html.indexOf('var productsJSON');
if (start !== -1) {
  const end = html.indexOf('};', start) + 2;
  console.log(html.substring(start, end));
}

// look for WCS REST API calls for product images
console.log('\n=== API calls for images ===');
const wcsRegex = /\/wcs\/resources\/store\/[^\s"']+image[^\s"']*/gi;
const wcsMatches = [...new Set(html.match(wcsRegex) || [])];
wcsMatches.forEach(u => console.log(' -', u));
