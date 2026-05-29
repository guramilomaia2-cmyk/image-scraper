const axios = require('axios');
const https = require('https');

async function test(url) {
    try {
        const res = await axios.get(url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        console.log(`URL: ${url}`);
        console.log(`Status: ${res.status}`);
        console.log(`Content-Length: ${res.data.length} bytes / headers cl: ${res.headers['content-length']}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log('------------------------------------------------');
    } catch (e) {
        console.error(`Error for ${url.slice(0, 80)}...:`, e.message);
    }
}

async function run() {
    const original = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=723&qlt=100,1&resMode=sharp2&size=723,804&chrss=full';
    
    // Test 1: Original URL (723x804)
    await test(original);

    // Test 2: Stripping wid, hei, size
    const stripped = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha';
    await test(stripped);

    // Test 3: Large width and height (e.g. wid=2500&hei=2500)
    const large = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&wid=2500&hei=2500';
    await test(large);

    // Test 4: Maximum size (e.g. wid=3000)
    const max = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&wid=3000';
    await test(max);
}

run();
