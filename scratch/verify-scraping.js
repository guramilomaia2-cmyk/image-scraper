const axios = require('axios');

async function verify() {
    const url = 'https://www.dell.com/en-uk/shop/dell-24-240hz-monitor-se2426hg/apd/210-bttf/monitors-monitor-accessories';
    console.log('Sending scrape request to local server...');
    try {
        const res = await axios.post('http://localhost:3000/api/scrape', { url });
        console.log(`Status: ${res.status}`);
        console.log(`Title: ${res.data.title}`);
        console.log(`Images found: ${res.data.images.length}`);
        
        console.log('\n--- Extracted Images (First 5) ---');
        res.data.images.slice(0, 5).forEach((img, i) => {
            console.log(`${i + 1}: ${img}`);
            const isUpscaled = !img.includes('wid=') && !img.includes('hei=') && !img.includes('size=') && img.includes('fmt=png-alpha');
            console.log(`   Is Upscaled: ${isUpscaled ? '✅ YES' : '❌ NO'}`);
        });
    } catch (e) {
        console.error('Error during verification:', e.message);
    }
}

verify();
