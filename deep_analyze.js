// Deep analysis of productsJSON - extract image data from script
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'rayban-static.html'), 'utf8');

// Extract the complete productsJSON block
const startMarker = 'var productsJSON = {';
const startPos = html.indexOf(startMarker);
if (startPos !== -1) {
  // Extract ~2000 chars from the marker
  const snippet = html.substring(startPos, startPos + 2000);
  console.log('productsJSON block:');
  console.log(snippet);
}

// Extract JSON from script type=application/json at pos ~144079
console.log('\n=== Script 28 (application/json with product data) ===');
const s28start = html.indexOf('{"resolvedSkuGridLensBridgeVal"');
if (s28start !== -1) {
  const s28end = html.indexOf('</script>', s28start);
  const s28content = html.substring(s28start, s28end);
  console.log(s28content);
}

// Look for any image-related patterns in the full HTML
console.log('\n=== All image patterns ===');
const patterns = [
  /https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp|gif)/gi,
  /\/is\/image\/RayBan\/[^"'\s<>]*/gi,
  /"image[^"]*":\s*"([^"]+)"/gi,
  /src="([^"]+(?:jpg|png|webp|gif|jpeg)[^"]*)"/gi,
];

for (const re of patterns) {
  const matches = [...new Set(html.match(re) || [])];
  if (matches.length > 0) {
    console.log('\nPattern:', re.toString().substring(0, 50));
    matches.slice(0, 20).forEach(m => console.log(' ', m));
  }
}
