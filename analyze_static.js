// Reads the saved rayban-static.html and extracts all image data from script tags
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'rayban-static.html'), 'utf8');
console.log('HTML Length:', html.length);

// Extract the productsJSON script (script 31)
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  const content = match[1];
  if (content.includes('productsJSON')) {
    console.log('\n=== productsJSON SCRIPT ===');
    console.log(content);
    console.log('=== END ===');
  }
  if (content.includes('"Image"')) {
    console.log('\n=== SCRIPT WITH Image FIELD (index ' + scriptIndex + ') ===');
    console.log(content.substring(0, 3000));
    console.log('=== END ===');
  }
  scriptIndex++;
}

// Also do a broad regex search for any image CDN URLs
console.log('\n=== All Ray-Ban CDN image URLs found ===');
const imgCdnRegex = /https?:\/\/(?:assets|images|media)\.ray-ban\.com[^"'\s<>]+/gi;
const allMatches = [...new Set(html.match(imgCdnRegex) || [])];
console.log('Count:', allMatches.length);
allMatches.forEach(u => console.log(' -', u));

// Search specifically for 8056262326831 or RW4006 image references
console.log('\n=== 8056262326831 occurrences ===');
const sku = '8056262326831';
let pos = html.indexOf(sku);
while (pos !== -1) {
  console.log('Found at pos', pos, ':', html.substring(Math.max(0, pos - 50), pos + 200).replace(/\n/g, ' '));
  console.log('---');
  pos = html.indexOf(sku, pos + 1);
}
