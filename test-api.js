const axios = require('axios');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

async function test() {
  const apiKey = 'heb5fbk4GfcbJkDdVz6qp3osstFMNDtChBh5LwKV8Y';
  console.log("Starting...");
  const initRes = await axios.post('https://api.extract.pics/v0/extractions', { url: "https://www.tp-link.com/en/business-networking/soho-switch-unmanaged/tl-sf1016d/v7/" }, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    httpsAgent: agent
  });
  
  const jobId = initRes.data?.data?.id;
  console.log("Job ID:", jobId);
  
  let attempts = 0;
  while(true) {
    attempts++;
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await axios.get(`https://api.extract.pics/v0/extractions/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      httpsAgent: agent
    });
    const status = statusRes.data?.data?.status;
    console.log(`Attempt ${attempts}, status: ${status}`);
    if (status === 'done' || status === 'error') {
      console.log("Images found:", statusRes.data?.data?.images?.length);
      break;
    }
  }
}
test();
