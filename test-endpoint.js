const axios = require('axios');

const url = 'https://www.ray-ban.com/australia/electronics/RW4006ray-ban%20meta%20wayfarer%20-%20gen%201-black/8056262326831';

async function test() {
  console.log('Sending scrape request to http://localhost:3000/api/scrape...');
  try {
    const res = await axios.post('http://localhost:3000/api/scrape', { url }, { timeout: 120000 });
    console.log('Scrape Response Status:', res.status);
    console.log('Scraped Images Count:', res.data.count);
    console.log('Scraped Title:', res.data.title);
    console.log('Via proxy method:', res.data.via);
    console.log('First 10 images:');
    res.data.images.slice(0, 10).forEach((img, i) => console.log(`  ${i+1}: ${img}`));
  } catch (err) {
    if (err.response) {
      console.error('Error Status:', err.response.status);
      console.error('Error Details:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

test();
