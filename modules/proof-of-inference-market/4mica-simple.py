#!/usr/bin/env python3
from flask import Flask, request, jsonify
import time
import hashlib

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/process-payment', methods=['POST', 'OPTIONS'])
@app.route('/pay', methods=['POST', 'OPTIONS'])
def process_payment():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json() or {}
    tab_id = f"tab_{int(time.time())}"
    tx_hash = f"0x{hashlib.sha256(tab_id.encode()).hexdigest()}"

    return jsonify({
        "success": True,
        "paymentHash": f"0x{hashlib.sha256(f'{tab_id}_receipt'.encode()).hexdigest()}",
        "transactionHash": tx_hash,
        "amount": data.get('amount_wei', '1.0'),
        "tabId": tab_id
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "4mica-payment", "mode": "demo-cors-enabled"})

if __name__ == '__main__':
    print("💳 4Mica Payment Service (CORS enabled) - Port 8084")
    app.run(host='0.0.0.0', port=8084, debug=False)
