const https = require('https');
const http = require('http');

exports.handler = async function(event) {
    const url = event.queryStringParameters.url;
    if (!url) {
        return { statusCode: 400, body: 'Missing url parameter' };
    }

    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        
        const req = lib.get(url, {
            rejectUnauthorized: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': url
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // simple redirect handling (1 level)
                lib.get(res.headers.location, { rejectUnauthorized: false }, handleResponse).on('error', handleError);
                return;
            }
            handleResponse(res);
        });

        req.on('error', handleError);

        function handleResponse(res) {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const contentType = res.headers['content-type'] || 'application/octet-stream';
                
                resolve({
                    statusCode: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, max-age=31536000'
                    },
                    body: buffer.toString('base64'),
                    isBase64Encoded: true
                });
            });
        }

        function handleError(err) {
            resolve({
                statusCode: 500,
                body: 'Failed to proxy image: ' + err.message
            });
        }
    });
};
