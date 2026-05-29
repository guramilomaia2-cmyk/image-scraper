const axios = require('axios');
const https = require('https');

async function testHead(url, name) {
    try {
        const res = await axios.head(url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        console.log(`--- ${name} ---`);
        console.log(`URL: ${url}`);
        console.log(`Status: ${res.status}`);
        console.log(`Content-Length: ${res.headers['content-length']} bytes`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log('------------------------------------------------');
    } catch (e) {
        console.error(`Error for ${name}:`, e.message);
    }
}

async function run() {
    const original = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=723&qlt=100,1&resMode=sharp2&size=723,804&chrss=full';
    const stripped = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha';
    const wid2000 = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&wid=2000';
    const wid2500 = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&wid=2500';
    const wid3000 = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&wid=3000';
    const wid4000 = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&wid=4000';

    await testHead(original, 'Original (723x804)');
    await testHead(stripped, 'Stripped (No wid/hei)');
    await testHead(wid2000, 'Width 2000');
    await testHead(wid2500, 'Width 2500');
    await testHead(wid3000, 'Width 3000');
    await testHead(wid4000, 'Width 4000');
}

run();
