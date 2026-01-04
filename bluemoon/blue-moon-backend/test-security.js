#!/usr/bin/env node
// Comprehensive API Test Suite
const http = require('http');

const BASE_URL = 'http://localhost:3000';
let AUTH_TOKEN = '';

async function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        return true;
    } catch (e) {
        console.log(`❌ ${name}: ${e.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function runTests() {
    console.log('\n📋 Blue Moon API - Comprehensive Test Suite\n');
    
    let passed = 0;
    let total = 0;

    // Test 1: Login & Get Token
    total++;
    if (await test('Login as admin', async () => {
        const res = await request('POST', '/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.token, 'No token returned');
        AUTH_TOKEN = res.data.token;
    })) passed++;

    // Test 2: Register New User
    total++;
    if (await test('Register new user', async () => {
        const res = await request('POST', '/api/auth/register', {
            username: 'testuser' + Date.now(),
            password: 'pass123456',
            email: `test${Date.now()}@example.com`,
            ten_nguoi_dung: 'Test User'
        });
        assert(res.status === 201, `Expected 201, got ${res.status}`);
    })) passed++;

    // Test 3: GET without auth (should work)
    total++;
    if (await test('GET public endpoint (no auth required)', async () => {
        const res = await request('GET', '/api/hogiadinh');
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.data.data), 'Data should be array');
    })) passed++;

    // Test 4: POST without auth (should fail)
    total++;
    if (await test('POST protected endpoint without token (401)', async () => {
        const res = await request('POST', '/api/hogiadinh', {
            ma_can_ho: 'A201',
            ten_chu_ho: 'No Auth User'
        });
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    })) passed++;

    // Test 5: POST with invalid token (should fail)
    total++;
    if (await test('POST with invalid token (403)', async () => {
        const res = await request('POST', '/api/hogiadinh', 
            { ma_can_ho: 'A202', ten_chu_ho: 'Bad Token' },
            'invalid.token.here'
        );
        assert(res.status === 403, `Expected 403, got ${res.status}`);
    })) passed++;

    // Test 6: POST with valid token (should succeed)
    total++;
    if (await test('POST with valid token (201)', async () => {
        const res = await request('POST', '/api/hogiadinh', 
            { 
                ma_can_ho: 'A' + Date.now().toString().slice(-3), 
                ten_chu_ho: 'Với Auth User' 
            },
            AUTH_TOKEN
        );
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        assert(res.data.data?.id, 'No ID returned');
    })) passed++;

    // Test 7: GET with token (should work)
    total++;
    if (await test('GET with token (200)', async () => {
        const res = await request('GET', '/api/hogiadinh', null, AUTH_TOKEN);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
    })) passed++;

    // Test 8: Verify token endpoint
    total++;
    if (await test('Verify token endpoint', async () => {
        const res = await request('GET', '/api/auth/verify', null, AUTH_TOKEN);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.id, 'No user ID in response');
    })) passed++;

    // Test 9: Invalid token verification
    total++;
    if (await test('Verify invalid token (403)', async () => {
        const res = await request('GET', '/api/auth/verify', null, 'bad.token');
        assert(res.status === 403, `Expected 403, got ${res.status}`);
    })) passed++;

    // Test 10: No token verification
    total++;
    if (await test('Verify without token (401)', async () => {
        const res = await request('GET', '/api/auth/verify');
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    })) passed++;

    console.log(`\n📊 Results: ${passed}/${total} tests passed`);
    process.exit(passed === total ? 0 : 1);
}

runTests().catch(console.error);
