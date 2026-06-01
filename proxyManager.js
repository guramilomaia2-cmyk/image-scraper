const axios = require('axios');

const https = require('https');

let proxyList = [];
let lastFetchTime = 0;

async function fetchProxies() {
  try {
    console.log('[ProxyManager] Fetching new free proxies from ProxyScrape...');
    const response = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all', {
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
    
    if (response.data) {
      const proxies = response.data.split('\n').map(p => p.trim()).filter(p => p.length > 5);
      if (proxies.length > 0) {
        proxyList = proxies;
        lastFetchTime = Date.now();
        console.log(`[ProxyManager] Successfully loaded ${proxyList.length} proxies.`);
      }
    }
  } catch (error) {
    console.error('[ProxyManager] Failed to fetch proxies:', error.message);
  }
}

async function getRandomProxy() {
  // Refresh proxy list every 1 hour
  if (proxyList.length === 0 || Date.now() - lastFetchTime > 60 * 60 * 1000) {
    await fetchProxies();
  }
  
  if (proxyList.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * proxyList.length);
  return `http://${proxyList[randomIndex]}`;
}

module.exports = {
  getRandomProxy
};
