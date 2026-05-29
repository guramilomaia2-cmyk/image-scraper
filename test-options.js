const axios = require('axios');
const cheerio = require('cheerio');

const SCRAPER_API_KEY = 'ac99f58a039f20b3b48f1575906bef8d';
const url = 'https://www.ray-ban.com/australia/electronics/RW4006ray-ban%20meta%20wayfarer%20-%20gen%201-black/8056262326831';

const options = [
  { name: '1. Premium JS + AU IP', query: '&render=true&premium=true&country_code=au' },
  { name: '2. Premium (No JS) + AU IP', query: '&premium=true&country_code=au' },
  { name: '3. JS Render (No Premium) + AU IP', query: '&render=true&country_code=au' },
  { name: '4. Fast (No JS, No Premium) + AU IP', query: '&country_code=au' },
  { name: '5. Premium JS + US IP', query: '&render=true&premium=true&country_code=us' },
  { name: '6. Premium JS (No country)', query: '&render=true&premium=true' },
  { name: '7. JS Render (No Premium, No country)', query: '&render=true' }
];

async function runTest(opt) {
  console.log(`Running: ${opt.name}...`);
  try {
    const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}${opt.query}`;
    const res = await axios.get(apiUrl, { timeout: 80000 });
    const $ = cheerio.load(res.data);
    const title = $('title').text().trim();
    const bodyText = $('body').text().trim().substring(0, 150).replace(/\s+/g, ' ');
    
    // Count image tags
    const imgCount = $('img').length;
    
    console.log(`  [SUCCESS] Status: ${res.status}, Length: ${res.data.length}`);
    console.log(`  Title: "${title}"`);
    console.log(`  Snippet: "${bodyText}"`);
    console.log(`  Images found: ${imgCount}`);
    return { name: opt.name, success: !title.toLowerCase().includes('access denied') && !bodyText.toLowerCase().includes('access denied'), imgCount, length: res.data.length };
  } catch (err) {
    console.log(`  [FAILED] Error: ${err.message}`);
    return { name: opt.name, success: false, error: err.message };
  }
}

async function main() {
  const results = [];
  for (const opt of options) {
    const result = await runTest(opt);
    results.push(result);
    console.log('--------------------------------------------------');
  }
  console.log('\nSUMMARY:');
  results.forEach(r => {
    console.log(`${r.name}: ${r.success ? 'SUCCESS ✔' : 'FAILED ❌'} (${r.imgCount || 0} images, length ${r.length || 0})`);
  });
}

main();
