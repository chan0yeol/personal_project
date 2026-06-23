const axios = require('axios');

const PORTAL_BASE   = 'https://unipost.co.kr';
const UNICLOUD_BASE = 'https://leave.unipost.co.kr';
const GW_BASE       = 'https://gw.unipost.co.kr';

function parseCookies(h) {
  return (h ?? []).map(c => c.split(';')[0]).join('; ');
}

function mergeCookies(a, b) {
  const map = {};
  [...a.split('; '), ...b.split('; ')].forEach(c => {
    const i = c.indexOf('=');
    if (i > 0) map[c.slice(0, i).trim()] = c.slice(i + 1).trim();
  });
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function loginPortal() {
  const s1 = await axios.get(`${PORTAL_BASE}/portal/login/portal-login`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    maxRedirects: 0,
    validateStatus: s => s < 400,
  });
  let ck = parseCookies(s1.headers['set-cookie']);

  const p = new URLSearchParams();
  p.append('loginType', 'IDPWD');
  p.append('loginId', process.env.LOGIN_ID);
  p.append('id', process.env.LOGIN_ID);
  p.append('password', process.env.LOGIN_PW);
  p.append('companyRegNo', '');

  const s2 = await axios.post(`${PORTAL_BASE}/portal/login/ajaxcheck`, p.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': ck,
      'Referer': `${PORTAL_BASE}/portal/login/portal-login`,
      'Origin': PORTAL_BASE,
      'ajax': 'true',
      'User-Agent': 'Mozilla/5.0',
    },
    maxRedirects: 0,
    validateStatus: s => s < 400,
  });
  const c2 = parseCookies(s2.headers['set-cookie']);
  if (c2) ck = mergeCookies(ck, c2);
  if (!s2.data?.response?.success) throw new Error('포털 로그인 실패');
  return ck;
}

async function getSsoSession(ck, portalPath, base) {
  const s3 = await axios.get(`${PORTAL_BASE}${portalPath}`, {
    headers: { 'Cookie': ck, 'Referer': `${PORTAL_BASE}/portal/login/portal-login`, 'User-Agent': 'Mozilla/5.0' },
    maxRedirects: 0,
    validateStatus: s => s < 400,
  });
  const c3 = parseCookies(s3.headers['set-cookie']);
  if (c3) ck = mergeCookies(ck, c3);
  const ssoUrl = s3.headers['location'];
  if (!ssoUrl?.includes('sso-in')) throw new Error(`SSO URL 없음: ${ssoUrl}`);

  const s4a = await axios.get(ssoUrl, {
    headers: { 'Cookie': ck, 'Referer': PORTAL_BASE, 'User-Agent': 'Mozilla/5.0' },
    maxRedirects: 0,
    validateStatus: s => s < 400,
  });
  const c4a = parseCookies(s4a.headers['set-cookie']);
  if (c4a) ck = mergeCookies(ck, c4a);

  let nextUrl = s4a.headers['location'];
  if (nextUrl && !nextUrl.startsWith('http')) nextUrl = `${base}${nextUrl}`;
  if (nextUrl) {
    const s4b = await axios.get(nextUrl, {
      headers: { 'Cookie': ck, 'Referer': ssoUrl, 'User-Agent': 'Mozilla/5.0' },
      maxRedirects: 5,
      validateStatus: s => s < 400,
    });
    const c4b = parseCookies(s4b.headers['set-cookie']);
    if (c4b) ck = mergeCookies(ck, c4b);
  }
  return ck;
}

async function loginAvs() {
  const ck = await loginPortal();
  return getSsoSession(ck, '/portal/avs?path=/unicloud/view/avs-dashboard', UNICLOUD_BASE);
}

async function loginGw() {
  const ck = await loginPortal();
  return getSsoSession(ck, '/portal/gw?path=/unicloud/view/gw-equip-reservation', GW_BASE);
}

module.exports = { loginPortal, loginAvs, loginGw, PORTAL_BASE, UNICLOUD_BASE, GW_BASE };
