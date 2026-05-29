const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const SCRAPER_API_KEY = 'ac99f58a039f20b3b48f1575906bef8d';
const url = 'https://www.ray-ban.com/australia/electronics/RW4006ray-ban%20meta%20wayfarer%20-%20gen%201-black/8056262326831';

async function test() {
  console.log('Testing ScraperAPI Premium JS (render=true & premium=true)...');
  try {
    const apiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true&premium=true&country_code=us&device_type=desktop`;
    const res = await axios.get(apiUrl, { timeout: 70000 });
    console.log('Success! Status:', res.status, 'HTML Length:', res.data.length);
    
    const outputPath = path.join(__dirname, 'rayban-rendered.html');
    fs.writeFileSync(outputPath, res.data);
    console.log('Saved rendered HTML to:', outputPath);
    
    const $ = cheerio.load(res.data);
    console.log('Title:', $('title').text());
    console.log('Body Text (first 500 chars):', $('body').text().trim().substring(0, 500));
    
    const images = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      const dataSrc = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original');
      if (src) images.push(src);
      if (dataSrc) images.push(dataSrc);
    });
    console.log('Found', images.length, 'images.');
    console.log('Images list:', images);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
