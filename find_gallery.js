// Find all color variant codes and the rb-pdp-gallery component data
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'rayban-static.html'), 'utf8');

// Find the rb-pdp-gallery component or similar
console.log('=== Searching for rb-pdp or rb-gallery or gallery component ===');
const galleryMatches = html.match(/<rb-pdp[^>]*>[\s\S]{0,500}/gi) || [];
galleryMatches.forEach(m => {
  console.log('MATCH:', m.substring(0, 400));
  console.log('---');
});

// Find rb-pdp-gallery, rb-carousel, or similar
const carouselMatches = html.match(/rb-(?:pdp-gallery|product-gallery|image-gallery|carousel)[^>]*>/gi) || [];
carouselMatches.forEach(m => console.log('CAROUSEL COMPONENT:', m));

// Extract the SKU list section at around position 89397
console.log('\n=== SKU array context ===');
const skuPos = html.indexOf("'8056262326787'");
if (skuPos !== -1) {
  console.log(html.substring(Math.max(0, skuPos - 500), skuPos + 1000));
}

// Look for image data-src or similar lazy loading patterns
console.log('\n=== data-src or lazy-src patterns ===');
const dataSrcMatches = html.match(/data-(?:src|lazy|original|image)="([^"]+(?:jpg|png|webp|gif)[^"]*)"/gi) || [];
dataSrcMatches.forEach(m => console.log(m));

// Look for rb-pdp-product-image or similar
console.log('\n=== image component attributes ===');
const imgComponentMatches = html.match(/(?:image|photo|gallery|picture)="(https?:[^"]+\.(?:jpg|jpeg|png|webp))"/gi) || [];
imgComponentMatches.forEach(m => console.log(m));

// Find any URLs with P21, P22 etc. (Ray-Ban shot codes)
console.log('\n=== Ray-Ban shot code URLs ===');
const shotCodeMatches = html.match(/https?:\/\/[^\s"'<>]*__P\d+[^\s"'<>]*/gi) || [];
[...new Set(shotCodeMatches)].forEach(m => console.log(m));

// Check wcs_endpoints full content
console.log('\n=== wcs_endpoints ===');
const wcsPos = html.indexOf('wcs_endpoints = {');
if (wcsPos !== -1) {
  const endPos = html.indexOf('};', wcsPos) + 2;
  console.log(html.substring(wcsPos, endPos).substring(0, 3000));
}
