const crypto = require('crypto');

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const header = {
  alg: 'HS256',
  typ: 'JWT'
};

const payload = {
  sub: '1',
  email: 'admin@restaurant.local',
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": 'Admin',
  role: 'Admin',
  exp: Math.floor(Date.now() / 1000) + 7200,
  iss: 'RestaurantManagement',
  aud: 'RestaurantManagementClient'
};

const encodedHeader = base64url(JSON.stringify(header));
const encodedPayload = base64url(JSON.stringify(payload));

const signature = crypto
  .createHmac('sha256', 'SecretKeyForRestaurantManagementProject')
  .update(encodedHeader + '.' + encodedPayload)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const token = `${encodedHeader}.${encodedPayload}.${signature}`;

const { execSync } = require('child_process');
try {
  const result = execSync(`curl -s -v -X GET "https://localhost:5071/api/Roster?weekStart=2026-04-20" -H "Authorization: Bearer ${token}" -H "Accept: application/json" -k`);
  console.log("SUCCESS:", result.toString());
} catch(e) {
  console.log("ERROR:", e);
}
