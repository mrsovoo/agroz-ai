const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5001,
      path,
      method: 'POST',
      headers
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5001,
      path,
      method: 'GET',
      headers
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing /v1/admin/version ---');
  const ver = await get('/v1/admin/version');
  console.log('Version:', ver.status, ver.data);

  console.log('\n--- 2. Testing /v1/admin/auth/login ---');
  const loginRes = await post('/v1/admin/auth/login', {
    email: 'admin@biznesgo.uz',
    password: 'admin2026!'
  });
  console.log('Login:', loginRes.status, loginRes.data);

  console.log('\n--- 3. Testing /v1/admin/auth/2fa/verify ---');
  const verifyRes = await post('/v1/admin/auth/2fa/verify', {
    temp_token: loginRes.data.temp_token,
    code: '123456'
  });
  console.log('2FA Verify:', verifyRes.status, verifyRes.data);
  const token = verifyRes.data.token;

  console.log('\n--- 4. Testing /v1/admin/admins (List) ---');
  const adminsRes = await get('/v1/admin/admins', token);
  console.log('Admins list count:', adminsRes.data?.admins?.length);
  console.log('First admin masked email:', adminsRes.data?.admins?.[0]?.email);

  console.log('\n--- 5. Testing /v1/admin/audit (Logs) ---');
  const auditRes = await get('/v1/admin/audit', token);
  console.log('Audit logs count:', auditRes.data?.logs?.length);
  console.log('Latest log action:', auditRes.data?.logs?.[0]?.action);

  console.log('\n--- 6. Testing /v1/admin/audit/reveal (Sensitive Reveal) ---');
  const revealRes = await post('/v1/admin/audit/reveal', {
    resource: 'admins',
    resource_id: 'adm_super_01',
    field_name: 'email',
    reason: 'Mijoz murojaati bo\'yicha tekshirish'
  }, token);
  console.log('Reveal result:', revealRes.status, revealRes.data);

  console.log('\n--- Phase 1 Test Complete! ---');
}

run().catch(console.error);

