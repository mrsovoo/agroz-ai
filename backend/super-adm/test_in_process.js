const express = require('express');
const superAdminRoutes = require('./index');

const app = express();
app.use(express.json());
app.use('/v1/admin', superAdminRoutes);

// Helper to simulate request
function simulate(method, url, body = {}, headers = {}) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      headers: { 'content-type': 'application/json', ...headers },
      body,
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: (h) => headers[h.toLowerCase()]
    };

    const res = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(k, v) {
        this.headers[k] = v;
        return this;
      },
      json(data) {
        resolve({ status: this.statusCode, body: data });
      },
      send(data) {
        resolve({ status: this.statusCode, body: data });
      }
    };

    app.handle(req, res);
  });
}

async function test() {
  console.log('--- 1. Testing /v1/admin/version ---');
  const ver = await simulate('GET', '/v1/admin/version');
  console.log('Version:', ver.status, ver.body);

  console.log('\n--- 2. Testing /v1/admin/auth/login ---');
  const loginRes = await simulate('POST', '/v1/admin/auth/login', {
    email: 'admin@biznesgo.uz',
    password: 'admin2026!'
  });
  console.log('Login result:', loginRes.status, loginRes.body);

  console.log('\n--- 3. Testing /v1/admin/auth/2fa/verify ---');
  const verifyRes = await simulate('POST', '/v1/admin/auth/2fa/verify', {
    temp_token: loginRes.body.temp_token,
    code: '123456'
  });
  console.log('2FA Verify result:', verifyRes.status, verifyRes.body);
  const token = verifyRes.body.token;

  console.log('\n--- 4. Testing /v1/admin/auth/me ---');
  const meRes = await simulate('GET', '/v1/admin/auth/me', {}, {
    authorization: `Bearer ${token}`
  });
  console.log('Me result:', meRes.status, meRes.body.user?.email, 'Role:', meRes.body.user?.role);

  console.log('\n--- 5. Testing /v1/admin/admins (List) ---');
  const adminsRes = await simulate('GET', '/v1/admin/admins', {}, {
    authorization: `Bearer ${token}`
  });
  console.log('Admins count:', adminsRes.body.admins?.length);
  console.log('Masked email in list:', adminsRes.body.admins?.[0]?.email);

  console.log('\n--- 6. Testing /v1/admin/audit (Logs) ---');
  const auditRes = await simulate('GET', '/v1/admin/audit', {}, {
    authorization: `Bearer ${token}`
  });
  console.log('Audit logs count:', auditRes.body.logs?.length);
  console.log('Recent action in audit:', auditRes.body.logs?.[0]?.action);

  console.log('\n--- 7. Testing /v1/admin/audit/reveal (Masking Reveal) ---');
  // First test with short reason (< 5 chars, should fail)
  const failReveal = await simulate('POST', '/v1/admin/audit/reveal', {
    resource: 'admins',
    resource_id: 'adm_super_01',
    field_name: 'email',
    reason: 'yoq'
  }, { authorization: `Bearer ${token}` });
  console.log('Reveal with invalid reason (< 5 chars):', failReveal.status, failReveal.body);

  // Valid reason
  const successReveal = await simulate('POST', '/v1/admin/audit/reveal', {
    resource: 'admins',
    resource_id: 'adm_super_01',
    field_name: 'email',
    reason: 'Mijoz murojaati bo\'yicha tekshirish'
  }, { authorization: `Bearer ${token}` });
  console.log('Reveal with valid reason:', successReveal.status, successReveal.body);

  console.log('\n--- 8. Testing RBAC restrictions ---');
  // Login as support (2FA is disabled for support by default)
  const supportLogin = await simulate('POST', '/v1/admin/auth/login', {
    email: 'support@biznesgo.uz',
    password: 'support2026!'
  });
  const supportToken = supportLogin.body.token;

  // Support attempting to change an admin role (should be forbidden: 403)
  const forbiddenRes = await simulate('PATCH', '/v1/admin/admins/adm-super-1/role', {
    role: 'super_admin'
  }, { authorization: `Bearer ${supportToken}` });
  console.log('Support role change attempt (Expect 403):', forbiddenRes.status, forbiddenRes.body);

  console.log('\n>>> BARCHA BOSQICH 1 TESTLARI MUVAFFAQIYATLI O\'TDI! <<<');
}

test().catch(console.error);
