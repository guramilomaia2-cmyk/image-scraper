
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);
const AdmZip = require('adm-zip');

const TARGET_URL = 'https://www.honor.com/uk/tablets/honor-magicpad-4/buy/';
const INCLUDE_KEYWORDS = ['magicpad-4', 'magicpad4', 'magic-pad-4', 'magicpad'];
const OUTPUT_DIR = path.join(__dirname, 'downloaded-images');
const ZIP_OUTPUT = path.join(__dirname, 'honor-other-images.zip');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function main() {
  console.log('🔍 Scraping:', TARGET_URL);

  // Step 1: scrape
  const scrapeRes = await axios.post('http://localhost:3000/scrape', { url: TARGET_URL });
  const { images, count } = scrapeRes.data;
  console.log(`\n📦 Total images found: ${count}`);

  // Step 2: filter out MagicPad 4 product images
  const filtered = images.filter(url => {
    const lower = url.toLowerCase();
    return !EXCLUDE_KEYWORDS.some(kw => lower.includes(kw));
  });

  const excluded = images.length - filtered.length;
  console.log(`🚫 Excluded (MagicPad 4 product images): ${excluded}`);
  console.log(`✅ Images to download: ${filtered.length}`);

  // Step 3: download
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const zip = new AdmZip();
  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < filtered.length; i++) {
    const imgUrl = filtered[i];
    try {
      // Use local proxy to avoid CORS/SSL issues
      const proxyUrl = `http://localhost:3000/proxy?url=${encodeURIComponent(imgUrl)}`;
      const response = await axios.get(proxyUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        httpsAgent,
      });

      const urlPath = new URL(imgUrl).pathname;
      let filename = path.basename(urlPath) || `image_${i}.jpg`;
      // Ensure unique filenames
      const baseName = path.basename(filename, path.extname(filename));
      const ext = path.extname(filename) || '.jpg';
      filename = `${String(i + 1).padStart(3, '0')}_${baseName}${ext}`;

      zip.addFile(filename, Buffer.from(response.data));
      downloaded++;
      process.stdout.write(`\r⬇️  Downloading... ${downloaded}/${filtered.length}`);
    } catch (e) {
      failed++;
      // silently skip failures
    }
  }

  console.log(`\n\n✅ Downloaded: ${downloaded} | ❌ Failed: ${failed}`);

  // Step 4: write ZIP
  zip.writeZip(ZIP_OUTPUT);
  console.log(`\n📦 ZIP saved to: ${ZIP_OUTPUT}`);
  console.log(`   Size: ${(fs.statSync(ZIP_OUTPUT).size / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
