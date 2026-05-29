const fs = require('fs');
const html = fs.readFileSync('rayban-rendered.html', 'utf8');

console.log('HTML Length:', html.length);

// Check if there are anti-bot patterns
const patterns = ['access denied', 'attention required', 'cf-challenge', 'turnstile', 'px-captcha', 'perimeterx', 'captcha', 'security check'];
patterns.forEach(p => {
  if (html.toLowerCase().includes(p)) {
    console.log('Anti-bot pattern matched:', p);
  }
});

// Search for any .jpg, .png, .webp urls
const regex = /https?:\/\/[^"'\s<>]*?\.(?:jpg|jpeg|png|gif|webp|svg)/gi;
const matches = html.match(regex) || [];
console.log('Total image-like URL matches in the HTML:', matches.length);

const uniqueMatches = [...new Set(matches)];
console.log('Unique image-like URLs:', uniqueMatches.length);
console.log('Some image URLs found:');
uniqueMatches.slice(0, 30).forEach(u => console.log(' -', u));

// Look for image data in JSON or window state
const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('Total script tags:', scripts.length);
let scriptWithImages = 0;
scripts.forEach((s, idx) => {
  if (s.includes('.jpg') || s.includes('.png') || s.includes('.webp') || s.includes('luxottica.com')) {
    scriptWithImages++;
  }
});
console.log('Scripts with image matches:', scriptWithImages);
