const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const SCRAPER_API_KEY = 'ac99f58a039f20b3b48f1575906bef8d';
const url = 'https://www.ray-ban.com/australia/electronics/RW4006ray-ban%20meta%20wayfarer%20-%20gen%201-black/8056262326831';

async function main() {
  console.log('Fetching Ray-Ban AU product page using ScraperAPI (No JS)...');
  try {
    const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=au&device_type=desktop`;
    const res = await axios.get(apiUrl, { timeout: 80000 });
    console.log('Success! Status:', res.status, 'HTML Length:', res.data.length);
    
    fs.writeFileSync(path.join(__dirname, 'rayban-static.html'), res.data);
    console.log('Saved static HTML to rayban-static.html');

    // Parse and search
    const $ = cheerio.load(res.data);
    console.log('Title:', $('title').text());
    
    // 1. Search for any script containing JSON-LD or script contents
    console.log('\n--- Script search ---');
    $('script').each((i, el) => {
      const type = $(el).attr('type');
      const html = $(el).html() || '';
      if (html.includes('8056262326831') || html.includes('RW4006') || html.includes('images.ray-ban.com') || html.includes('image') || html.includes('PDP')) {
        console.log(`Script ${i} (type="${type || 'none'}"), length: ${html.length}`);
        console.log('Snippet:', html.substring(0, 300).trim().replace(/\s+/g, ' '));
        if (html.length > 300) {
          console.log('Snippet end:', html.substring(html.length - 300).trim().replace(/\s+/g, ' '));
        }
        console.log('------------------------');
      }
    });

    // 2. Search for any occurrences of Ray-Ban image domain or pattern
    console.log('\n--- Match URLs in raw text ---');
    const raybanImgRegex = /https?:\/\/images\.ray-ban\.com\/is\/image\/RayBan\/[^"'\s<>]*?/gi;
    const rawMatches = res.data.match(raybanImgRegex) || [];
    console.log('Total Raw Matches:', rawMatches.length);
    const uniqueRaw = [...new Set(rawMatches)];
    console.log('Unique Raw Matches:', uniqueRaw.length);
    uniqueRaw.slice(0, 10).forEach(u => console.log(' -', u));

    // 3. Search for any standard images
    console.log('\n--- Cheerio <img> tags ---');
    $('img').each((i, el) => {
      console.log(`Img ${i}: src="${$(el).attr('src')}" srcset="${$(el).attr('srcset')}" data-src="${$(el).attr('data-src')}"`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
