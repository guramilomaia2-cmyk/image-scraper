const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

async function run() {
    const url = 'https://www.dell.com/en-uk/shop/dell-24-240hz-monitor-se2426hg/apd/210-bttf/monitors-monitor-accessories';
    try {
        const res = await axios.get(url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            }
        });
        const $ = cheerio.load(res.data);
        
        console.log('--- Dell Image Tags Found ---');
        const images = [];
        $('img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-srcset');
            if (src && (src.includes('dell') || src.includes('scene7'))) {
                images.push({
                    src,
                    alt: $(el).attr('alt'),
                    parentClass: $(el).parent().attr('class'),
                    class: $(el).attr('class')
                });
            }
        });
        console.log(JSON.stringify(images.slice(0, 20), null, 2));

        console.log('\n--- Script tags search ---');
        $('script:not([src])').each((i, el) => {
            const text = $(el).html() || '';
            if (text.includes('scene7') || text.includes('dell.com/is/image')) {
                console.log(`Found image strings in script ${i}, length: ${text.length}`);
                // print a small slice around the keyword
                const idx = text.indexOf('scene7');
                console.log(text.slice(Math.max(0, idx - 100), Math.min(text.length, idx + 400)));
            }
        });
    } catch (e) {
        console.error('Error fetching Dell:', e.message);
    }
}

run();
