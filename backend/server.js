import http from 'node:http';
import https from 'node:https';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8');
  for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    process.env[key] = value;
  }
}

const port = process.env.MEMORY_HUB_BACKEND_PORT || 8787;
const tenantId = process.env.MICROSOFT_TENANT_ID || '';
const clientId = process.env.MICROSOFT_CLIENT_ID || '';
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
const redirectUri = process.env.MICROSOFT_REDIRECT_URI || '';
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || '';
const tokenStorePath = join(process.cwd(), '.microsoft-tokens.json');
const syncStorePath = join(process.cwd(), '.microsoft-sync.json');
const googleTokenStorePath = join(process.cwd(), '.google-tokens.json');
const googleSyncStorePath = join(process.cwd(), '.google-sync.json');
const scopes = [
  'offline_access',
  'openid',
  'profile',
  'User.Read',
  'Mail.Read',
  'Calendars.Read',
  'Files.Read',
  'Files.Read.All'
];
const googleScopes = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

function loadJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function saveJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function loadTokenStore() {
  return loadJson(tokenStorePath);
}

function saveTokenStore(data) {
  saveJson(tokenStorePath, data);
}

function loadSyncStore() {
  return loadJson(syncStorePath);
}

function saveSyncStore(data) {
  saveJson(syncStorePath, data);
}

function loadGoogleTokenStore() {
  return loadJson(googleTokenStorePath);
}

function saveGoogleTokenStore(data) {
  saveJson(googleTokenStorePath, data);
}

function loadGoogleSyncStore() {
  return loadJson(googleSyncStorePath);
}

function saveGoogleSyncStore(data) {
  saveJson(googleSyncStorePath, data);
}

function getMicrosoftStatus() {
  const configured = Boolean(tenantId && clientId && clientSecret && redirectUri);
  const tokenStore = loadTokenStore();
  const syncStore = loadSyncStore();
  const connected = Boolean(tokenStore?.access_token || tokenStore?.refresh_token);
  const partial = Boolean(syncStore?.partial);
  return {
    connected,
    configured,
    partial,
    accountLabel: connected ? 'Microsoft account connected locally' : configured ? 'Microsoft app configured locally' : 'Microsoft app not configured',
    lastSyncAt: syncStore?.synced_at || tokenStore?.received_at || null,
    connectors: {
      outlook: connected ? (partial && !syncStore?.mail ? 'partial' : 'connected') : configured ? 'ready-for-auth' : 'needs-config',
      onedrive: connected ? (syncStore?.driveError ? 'unavailable' : 'connected') : configured ? 'ready-for-auth' : 'needs-config'
    },
    profile: syncStore?.profile || null,
    syncSummary: syncStore?.summary || null,
    issues: syncStore?.issues || []
  };
}

function getGoogleStatus() {
  const configured = Boolean(googleClientId && googleClientSecret && googleRedirectUri);
  const tokenStore = loadGoogleTokenStore();
  const syncStore = loadGoogleSyncStore();
  const connected = Boolean(tokenStore?.access_token || tokenStore?.refresh_token);
  return {
    connected,
    configured,
    accountLabel: connected ? 'Google Workspace account connected locally' : configured ? 'Google Workspace app configured locally' : 'Google Workspace app not configured',
    lastSyncAt: syncStore?.synced_at || tokenStore?.received_at || null,
    connectors: {
      gmail: connected ? 'connected' : configured ? 'ready-for-auth' : 'needs-config',
      calendar: connected ? 'connected' : configured ? 'ready-for-auth' : 'needs-config',
      drive: connected ? 'connected' : configured ? 'ready-for-auth' : 'needs-config'
    },
    profile: syncStore?.profile || null,
    syncSummary: syncStore?.summary || null,
    issues: syncStore?.issues || []
  };
}

function buildMicrosoftAuthUrl() {
  const authBase = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: scopes.join(' '),
    prompt: 'select_account'
  });
  return `${authBase}?${params.toString()}`;
}

function buildGoogleAuthUrl() {
  const authBase = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent select_account',
    scope: googleScopes.join(' ')
  });
  return `${authBase}?${params.toString()}`;
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body, null, 2));
}

function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function parseJsonMaybe(raw) {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function postForm(url, data) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(data).toString();
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode || 500,
          raw,
          json: parseJsonMaybe(raw)
        });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url, accessToken, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...extraHeaders
      }
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode || 500,
          raw,
          json: parseJsonMaybe(raw)
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function graphGet(path, accessToken) {
  return getJson(`https://graph.microsoft.com${path}`, accessToken);
}

async function refreshAccessTokenIfNeeded() {
  const tokenStore = loadTokenStore();
  if (!tokenStore?.refresh_token) return tokenStore;
  const receivedAt = tokenStore.received_at ? Date.parse(tokenStore.received_at) : 0;
  const expiresInMs = (tokenStore.expires_in || 0) * 1000;
  const stillValid = tokenStore.access_token && receivedAt && Date.now() < receivedAt + expiresInMs - 60000;
  if (stillValid) return tokenStore;
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const tokenResponse = await postForm(tokenUrl, {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokenStore.refresh_token,
    grant_type: 'refresh_token',
    scope: scopes.join(' ')
  });
  if (tokenResponse.status >= 400) throw new Error(`Refresh failed: ${JSON.stringify(tokenResponse.json || tokenResponse.raw)}`);
  if (!tokenResponse.json) throw new Error('Refresh returned a non-JSON response.');
  const refreshed = {
    ...tokenStore,
    ...tokenResponse.json,
    refresh_token: tokenResponse.json.refresh_token || tokenStore.refresh_token,
    received_at: new Date().toISOString()
  };
  saveTokenStore(refreshed);
  return refreshed;
}

async function refreshGoogleAccessTokenIfNeeded() {
  const tokenStore = loadGoogleTokenStore();
  if (!tokenStore?.refresh_token) return tokenStore;
  const receivedAt = tokenStore.received_at ? Date.parse(tokenStore.received_at) : 0;
  const expiresInMs = (tokenStore.expires_in || 0) * 1000;
  const stillValid = tokenStore.access_token && receivedAt && Date.now() < receivedAt + expiresInMs - 60000;
  if (stillValid) return tokenStore;

  const tokenResponse = await postForm('https://oauth2.googleapis.com/token', {
    client_id: googleClientId,
    client_secret: googleClientSecret,
    refresh_token: tokenStore.refresh_token,
    grant_type: 'refresh_token'
  });
  if (tokenResponse.status >= 400) throw new Error(`Google refresh failed: ${JSON.stringify(tokenResponse.json || tokenResponse.raw)}`);
  if (!tokenResponse.json) throw new Error('Google refresh returned a non-JSON response.');
  const refreshed = {
    ...tokenStore,
    ...tokenResponse.json,
    refresh_token: tokenResponse.json.refresh_token || tokenStore.refresh_token,
    received_at: new Date().toISOString()
  };
  saveGoogleTokenStore(refreshed);
  return refreshed;
}

function issue(name, result) {
  return {
    endpoint: name,
    status: result.status,
    body: result.json || result.raw || null
  };
}

function summarizeGmail(items = []) {
  return items.map((item) => ({
    id: item.id,
    threadId: item.threadId || null,
    snippet: item.snippet || ''
  }));
}

function summarizeGoogleEvents(items = []) {
  return items.map((item) => ({
    id: item.id,
    summary: item.summary || '(no title)',
    start: item.start?.dateTime || item.start?.date || null,
    end: item.end?.dateTime || item.end?.date || null,
    htmlLink: item.htmlLink || null
  }));
}

function summarizeGoogleDrive(items = []) {
  return items.map((item) => ({
    id: item.id,
    name: item.name || '(unnamed)',
    mimeType: item.mimeType || null,
    modifiedTime: item.modifiedTime || null,
    webViewLink: item.webViewLink || null
  }));
}

function extractQuery(reqUrl) {
  const url = new URL(reqUrl, `http://localhost:${port}`);
  return url.searchParams.get('q') || url.searchParams.get('query') || '';
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: 'Missing URL' });
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });

  if (req.method === 'GET' && req.url === '/api/connectors/microsoft/status') {
    const status = getMicrosoftStatus();
    return sendJson(res, 200, {
      status,
      connect: { url: '/api/connectors/microsoft/connect', method: 'POST' },
      sync: { url: '/api/connectors/microsoft/sync', method: 'POST' }
    });
  }

  if (req.method === 'GET' && req.url === '/api/connectors/google/status') {
    const status = getGoogleStatus();
    return sendJson(res, 200, {
      status,
      connect: { url: '/api/connectors/google/connect', method: 'POST' },
      sync: { url: '/api/connectors/google/sync', method: 'POST' },
      searchDrive: { url: '/api/connectors/google/drive/search?q=resume', method: 'GET' },
      searchGmail: { url: '/api/connectors/google/gmail/search?q=resume', method: 'GET' }
    });
  }

  if (req.method === 'POST' && req.url === '/api/connectors/microsoft/connect') {
    const status = getMicrosoftStatus();
    if (!status.configured) return sendJson(res, 400, { ok: false, message: 'Microsoft connector is not fully configured. Check backend .env values.' });
    return sendJson(res, 200, { ok: true, authUrl: buildMicrosoftAuthUrl(), message: 'Open the authUrl in a browser to begin Microsoft sign-in.' });
  }

  if (req.method === 'POST' && req.url === '/api/connectors/google/connect') {
    const status = getGoogleStatus();
    if (!status.configured) return sendJson(res, 400, { ok: false, message: 'Google connector is not fully configured. Check backend .env values.' });
    return sendJson(res, 200, { ok: true, authUrl: buildGoogleAuthUrl(), message: 'Open the authUrl in a browser to begin Google sign-in.' });
  }

  if (req.method === 'GET' && req.url.startsWith('/api/connectors/google/callback')) {
    const url = new URL(req.url, `http://localhost:${port}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error) return sendHtml(res, 400, `<h1>Google connection failed</h1><p>${error}</p>`);
    if (!code) return sendHtml(res, 400, '<h1>Missing authorization code</h1>');

    try {
      const tokenResponse = await postForm('https://oauth2.googleapis.com/token', {
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code,
        redirect_uri: googleRedirectUri,
        grant_type: 'authorization_code'
      });
      if (tokenResponse.status >= 400) return sendHtml(res, 500, `<h1>Google token exchange failed</h1><pre>${JSON.stringify(tokenResponse.json || tokenResponse.raw, null, 2)}</pre>`);
      if (!tokenResponse.json) return sendHtml(res, 500, '<h1>Google token exchange failed</h1><p>Google returned a non-JSON response.</p>');
      saveGoogleTokenStore({ ...tokenResponse.json, received_at: new Date().toISOString() });
      return sendHtml(res, 200, '<h1>Google Workspace connected</h1><p>You can return to Memory Hub now.</p>');
    } catch (err) {
      return sendHtml(res, 500, `<h1>Google callback error</h1><pre>${String(err)}</pre>`);
    }
  }

  if (req.method === 'GET' && req.url.startsWith('/api/connectors/microsoft/callback')) {
    const url = new URL(req.url, `http://localhost:${port}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error) return sendHtml(res, 400, `<h1>Microsoft connection failed</h1><p>${error}</p>`);
    if (!code) return sendHtml(res, 400, '<h1>Missing authorization code</h1>');

    try {
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const tokenResponse = await postForm(tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: scopes.join(' ')
      });
      if (tokenResponse.status >= 400) return sendHtml(res, 500, `<h1>Token exchange failed</h1><pre>${JSON.stringify(tokenResponse.json || tokenResponse.raw, null, 2)}</pre>`);
      if (!tokenResponse.json) return sendHtml(res, 500, '<h1>Token exchange failed</h1><p>Microsoft returned a non-JSON response.</p>');
      saveTokenStore({ ...tokenResponse.json, received_at: new Date().toISOString() });
      return sendHtml(res, 200, '<h1>Microsoft connected</h1><p>You can return to Memory Hub now.</p>');
    } catch (err) {
      return sendHtml(res, 500, `<h1>Callback error</h1><pre>${String(err)}</pre>`);
    }
  }

  if (req.method === 'GET' && req.url.startsWith('/api/connectors/google/drive/search')) {
    const query = extractQuery(req.url).trim();
    if (!query) return sendJson(res, 400, { ok: false, message: 'Missing search query. Use ?q=resume' });
    try {
      const tokenStore = await refreshGoogleAccessTokenIfNeeded();
      const accessToken = tokenStore?.access_token;
      if (!accessToken) return sendJson(res, 500, { ok: false, message: 'No Google access token available after refresh.' });
      const q = encodeURIComponent(`name contains '${query.replace(/'/g, "\\'")}'`);
      const response = await getJson(`https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=10&fields=files(id,name,mimeType,modifiedTime,webViewLink)`, accessToken);
      if (response.status >= 400 || !response.json) {
        return sendJson(res, response.status >= 400 ? response.status : 502, { ok: false, message: 'Drive search failed.', error: response.json || response.raw || null });
      }
      return sendJson(res, 200, {
        ok: true,
        query,
        results: summarizeGoogleDrive(response.json.files || [])
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, message: 'Drive search failed.', error: String(err) });
    }
  }

  if (req.method === 'GET' && req.url.startsWith('/api/connectors/google/gmail/search')) {
    const query = extractQuery(req.url).trim();
    if (!query) return sendJson(res, 400, { ok: false, message: 'Missing search query. Use ?q=resume' });
    try {
      const tokenStore = await refreshGoogleAccessTokenIfNeeded();
      const accessToken = tokenStore?.access_token;
      if (!accessToken) return sendJson(res, 500, { ok: false, message: 'No Google access token available after refresh.' });
      const response = await getJson(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`, accessToken);
      if (response.status >= 400 || !response.json) {
        return sendJson(res, response.status >= 400 ? response.status : 502, { ok: false, message: 'Gmail search failed.', error: response.json || response.raw || null });
      }
      return sendJson(res, 200, {
        ok: true,
        query,
        results: summarizeGmail(response.json.messages || [])
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, message: 'Gmail search failed.', error: String(err) });
    }
  }

  if (req.method === 'POST' && req.url === '/api/connectors/google/sync') {
    const status = getGoogleStatus();
    if (!status.connected) return sendJson(res, 400, { ok: false, message: 'Google is not connected yet. Complete the auth flow first.' });

    try {
      const tokenStore = await refreshGoogleAccessTokenIfNeeded();
      const accessToken = tokenStore?.access_token;
      if (!accessToken) return sendJson(res, 500, { ok: false, message: 'No Google access token available after refresh.' });

      const results = await Promise.all([
        getJson('https://openidconnect.googleapis.com/v1/userinfo', accessToken).then((r) => ['profile', r]),
        getJson('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', accessToken).then((r) => ['gmail', r]),
        getJson('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&singleEvents=true&orderBy=startTime&timeMin=' + encodeURIComponent(new Date().toISOString()), accessToken).then((r) => ['calendar', r]),
        getJson('https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink)', accessToken).then((r) => ['drive', r])
      ]);

      const map = Object.fromEntries(results);
      const issues = [];
      if (map.profile.status >= 400 || !map.profile.json) issues.push(issue('profile', map.profile));
      if (map.gmail.status >= 400 || !map.gmail.json) issues.push(issue('gmail', map.gmail));
      if (map.calendar.status >= 400 || !map.calendar.json) issues.push(issue('calendar', map.calendar));
      if (map.drive.status >= 400 || !map.drive.json) issues.push(issue('drive', map.drive));

      const profileJson = map.profile.json || {};
      const gmailJson = map.gmail.json || { messages: [] };
      const calendarJson = map.calendar.json || { items: [] };
      const driveJson = map.drive.json || { files: [] };

      const snapshot = {
        synced_at: new Date().toISOString(),
        issues,
        profile: map.profile.json ? {
          email: profileJson.email || null,
          name: profileJson.name || null,
          picture: profileJson.picture || null,
          sub: profileJson.sub || null
        } : null,
        summary: {
          gmailMessages: (gmailJson.messages || []).length,
          upcomingEvents: (calendarJson.items || []).length,
          driveItems: (driveJson.files || []).length
        },
        gmail: map.gmail.json ? summarizeGmail(gmailJson.messages) : null,
        calendar: map.calendar.json ? summarizeGoogleEvents(calendarJson.items) : null,
        drive: map.drive.json ? summarizeGoogleDrive(driveJson.files) : null
      };

      saveGoogleSyncStore(snapshot);

      return sendJson(res, issues.length ? 207 : 200, {
        ok: true,
        partial: issues.length > 0,
        message: issues.length ? 'Google sync completed with partial results.' : 'Google sync completed.',
        snapshot
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, message: 'Google sync failed.', error: String(err) });
    }
  }

  if (req.method === 'POST' && req.url === '/api/connectors/microsoft/sync') {
    const status = getMicrosoftStatus();
    if (!status.connected) return sendJson(res, 400, { ok: false, message: 'Microsoft is not connected yet. Complete the auth flow first.' });

    try {
      const tokenStore = await refreshAccessTokenIfNeeded();
      const accessToken = tokenStore?.access_token;
      if (!accessToken) return sendJson(res, 500, { ok: false, message: 'No access token available after refresh.' });

      const results = await Promise.all([
        graphGet('/v1.0/me', accessToken).then((r) => ['profile', r]),
        graphGet('/v1.0/me/messages?$top=10&$select=id,subject,receivedDateTime,webLink,from', accessToken).then((r) => ['mail', r]),
        graphGet('/v1.0/me/events?$top=10&$select=id,subject,start,end,webLink&$orderby=start/dateTime', accessToken).then((r) => ['calendar', r]),
        graphGet('/v1.0/me/drive/root/children?$top=20&$select=id,name,webUrl,lastModifiedDateTime,folder,file', accessToken).then((r) => ['drive', r])
      ]);

      const map = Object.fromEntries(results);
      const issues = [];
      if (map.profile.status >= 400 || !map.profile.json) issues.push(issue('profile', map.profile));
      if (map.mail.status >= 400 || !map.mail.json) issues.push(issue('mail', map.mail));
      if (map.calendar.status >= 400 || !map.calendar.json) issues.push(issue('calendar', map.calendar));
      if (map.drive.status >= 400 || !map.drive.json) issues.push(issue('drive', map.drive));

      const profileJson = map.profile.json || {};
      const mailJson = map.mail.json || { value: [] };
      const calendarJson = map.calendar.json || { value: [] };
      const driveJson = map.drive.json || { value: [] };

      const snapshot = {
        synced_at: new Date().toISOString(),
        partial: issues.length > 0,
        issues,
        profile: map.profile.json ? {
          displayName: profileJson.displayName || null,
          userPrincipalName: profileJson.userPrincipalName || null,
          mail: profileJson.mail || null,
          id: profileJson.id || null
        } : null,
        summary: {
          recentMessages: (mailJson.value || []).length,
          upcomingEvents: (calendarJson.value || []).length,
          driveItems: (driveJson.value || []).length
        },
        mail: map.mail.json ? mailJson.value : null,
        calendar: map.calendar.json ? calendarJson.value : null,
        drive: map.drive.json ? driveJson.value : null,
        driveError: issues.find((x) => x.endpoint === 'drive') || null
      };

      saveSyncStore(snapshot);
      return sendJson(res, issues.length ? 207 : 200, {
        ok: true,
        partial: issues.length > 0,
        message: issues.length ? 'Microsoft sync completed with partial results.' : 'Microsoft sync completed.',
        snapshot
      });
    } catch (err) {
      return sendJson(res, 500, { ok: false, message: 'Microsoft sync failed.', error: String(err) });
    }
  }

  return sendJson(res, 404, { error: 'Not found', path: req.url });
});

server.listen(port, () => {
  console.log(`Memory Hub backend listening on http://localhost:${port}`);
});
