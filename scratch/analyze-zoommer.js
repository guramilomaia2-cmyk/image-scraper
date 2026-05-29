const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

async function run() {
    const url = 'https://zoommer.ge/planshetebi/samsung-sm-x135-galaxy-tab-a11-8-128gb-lte-grey-p50233';
    try {
        const res = await axios.get(url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        
        const images = [];
        $('img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && src.includes('zoommer-images')) {
                images.push({
                    src,
                    alt: $(el).attr('alt'),
                    class: $(el).attr('class'),
                    parentClass: $(el).parent().attr('class'),
                    parentTag: $(el).parent().prop('tagName')
                });
            }
        });
        
        console.log('--- Zoommer Product Images Found ---');
        console.log(JSON.stringify(images.slice(0, 15), null, 2));

        // Let's also see what tags/classes are around the main gallery image
        console.log('\n--- Gallery containers ---');
        $('.gallery-container, .product-gallery, .product-images, [class*="gallery"], [class*="swiper"]').each((i, el) => {
            console.log($(el).attr('class'), $(el).find('img').length);
        });
    } catch (e) {
        console.error('Error fetching Zoommer:', e.message);
    }
}

run();
