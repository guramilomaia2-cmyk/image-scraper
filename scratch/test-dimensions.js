const axios = require('axios');
const https = require('https');

function getPngDimensions(buffer) {
    // Check if it is a PNG
    if (buffer.readUInt32BE(0) !== 0x89504E47) {
        return null;
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
}

async function checkDimensions(url, name) {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        const dims = getPngDimensions(res.data);
        console.log(`--- ${name} ---`);
        if (dims) {
            console.log(`Dimensions: ${dims.width} x ${dims.height} (png)`);
        } else {
            console.log(`Dimensions: Not a PNG or failed to read`);
        }
        console.log(`File Size: ${(res.data.length / 1024 / 1024).toFixed(2)} MB`);
    } catch (e) {
        console.error(`Error for ${name}:`, e.message);
    }
}

async function run() {
    const original = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=723&qlt=100,1&resMode=sharp2&size=723,804&chrss=full';
    const stripped = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha';
    const wid2500 = 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/s-series/se2426hg/mg/monitor-se2426hg-black-gallery-1.psd?fmt=png-alpha&wid=2500';
    
    await checkDimensions(original, 'Original');
    await checkDimensions(stripped, 'Stripped');
    await checkDimensions(wid2500, 'Width 2500');
}

run();
