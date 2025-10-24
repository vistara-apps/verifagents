const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

// Mock 4Mica API endpoints
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: '4mica-api' });
});

app.get('/public-params', (req, res) => {
    res.json({
        public_key: [153,108,6,165,56,57,107,18,186,188,170,88,195,153,34,66,240,207,94,162,41,87,135,222,233,208,217,77,61,237,10,196,57,173,48,142,166,253,127,21,33,135,93,147,3,229,144,249],
        contract_address: process.env.CONTRACT_ADDRESS,
        ethereum_http_rpc_url: process.env.ETHEREUM_HTTP_RPC_URL,
        eip712_name: "4Mica",
        eip712_version: "1",
        chain_id: 17000
    });
});

app.post('/create-payment-tab', (req, res) => {
    const { user_address, recipient_address, ttl } = req.body;
    const tab_id = Math.floor(Math.random() * 1000000);
    
    res.json({
        tab_id: tab_id.toString(),
        user_address,
        recipient_address,
        ttl,
        status: 'created'
    });
});

app.post('/issue-guarantee', (req, res) => {
    const { claims, signature, scheme } = req.body;
    
    res.json({
        claims: claims,
        signature: signature,
        scheme: scheme,
        certificate: 'mock_bls_cert',
        public_key: 'mock_bls_pk'
    });
});

app.post('/sign-payment', (req, res) => {
    const { claims, scheme } = req.body;
    
    res.json({
        signature: '0x' + Math.random().toString(16).substr(2, 64),
        scheme: scheme || 'Eip712'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 4Mica API server running on http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   GET  /public-params`);
    console.log(`   POST /create-payment-tab`);
    console.log(`   POST /issue-guarantee`);
    console.log(`   POST /sign-payment`);
});
