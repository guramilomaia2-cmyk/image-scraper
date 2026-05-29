const axios = require('axios');

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'ac99f58a039f20b3b48f1575906bef8d';

exports.handler = async function (event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    try {
        const response = await axios.get(`https://api.scraperapi.com/account?api_key=${SCRAPER_API_KEY}`, { timeout: 5000 });
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                creditsLeft: response.data.creditsLeft,
                requestLimit: response.data.requestLimit
            })
        };
    } catch (err) {
        console.error('Failed to fetch ScraperAPI limits inside function:', err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch ScraperAPI limits' })
        };
    }
};
