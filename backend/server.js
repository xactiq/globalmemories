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
const tokenStorePath = join(process.cwd(), '.microsoft-tokens.json');
const syncStorePath = join(process.cwd(), '.microsoft-sync.json');
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

function getMicrosoftStatus() {
  const configured = Boolean(tenantId && clientId && clientSecret && redirectUri);
  const tokenStore = loadTokenStore();
  const syncStore = loadSyncStore();
  const connected = Boolean(tokenStore?.access_token || tokenStore?.refresh_token);
  return {
    connected,
    configured,
    accountLabel: connected ? 'Microsoft account connected locally' : configured ? 'Microsoft app configured locally' : 'Microsoft app not configured',
    lastSyncAt: syncStore?.synced_at || tokenStore?.received_at || null,
    connectors: {
      outlook: connected ? 'connected' : configured ? 'ready-for-auth' : 'needs-config',
      onedrive: connected ? 'connected' : configured ? 'ready-for-auth' : 'needs-config'
    },
    profile: syncStore?.profile || null,
    syncSummary: syncStore?.summary || null
  };
}

function buildMicrosoftAuthUrl() {
  const authBase = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: scopes.join(' ')
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
        try {
          resolve({ status: res.statusCode || 500, json: JSON.parse(raw) });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function graphGet(path, accessToken) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph.microsoft.com',
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, json: JSON.parse(raw) });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
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

  if (tokenResponse.status >= 400) {
    throw new Error(`Refresh failed: ${JSON.stringify(tokenResponse.json)}`);
  }

  const refreshed = {
    ...tokenStore,
    ...tokenResponse.json,
    refresh_token: tokenResponse.json.refresh_token || tokenStore.refresh_token,
    received_at: new Date().toISOString()
  };
  saveTokenStore(refreshed);
  return refreshed;
}

function summarizeMail(items = []) {
  return items.map((item) => ({
    id: item.id,
    subject: item.subject || '(no subject)',
    from: item.from?.emailAddress?.address || null,
    receivedDateTime: item.receivedDateTime || null,
    webLink: item.webLink || null
  }));
}

function summarizeEvents(items = []) {
  return items.map((item) => ({
    id: item.id,
    subject: item.subject || '(no title)',
    start: item.start?.dateTime || null,
    end: item.end?.dateTime || null,
    webLink: item.webLink || null
  }));
}

function summarizeDrive(items = []) {
  return items.map((item) => ({
    id: item.id,
    name: item.name || '(unnamed)',
    webUrl: item.webUrl || null,
    lastModifiedDateTime: item.lastModifiedDateTime || null,
    kind: item.folder ? 'folder' : item.file ? 'file' : 'item'
  }));
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

  if (req.method === 'POST' && req.url === '/api/connectors/microsoft/connect') {
    const status = getMicrosoftStatus();
    if (!status.configured) {
      return sendJson(res, 400, {
        ok: false,
        message: 'Microsoft connector is not fully configured. Check backend .env values.'
      });
    }
    return sendJson(res, 200, {
      ok: true,
      authUrl: buildMicrosoftAuthUrl(),
      message: 'Open the authUrl in a browser to begin Microsoft sign-in.'
    });
  }

  if (req.method === 'GET' && req.url.startsWith('/api/connectors/microsoft/callback')) {
    const url = new URL(req.url, `http://localhost:${port}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      return sendHtml(res, 400, `<h1>Microsoft connection failed</h1><p>${error}</p>`);
    }

    if (!code) {
      return sendHtml(res, 400, '<h1>Missing authorization code</h1>');
    }

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

      if (tokenResponse.status >= 400) {
        return sendHtml(res, 500, `<h1>Token exchange failed</h1><pre>${JSON.stringify(tokenResponse.json, null, 2)}</pre>`);
      }

      saveTokenStore({
        ...tokenResponse.json,
        received_at: new Date().toISOString()
      });

      return sendHtml(res, 200, '<h1>Microsoft connected</h1><p>You can return to Memory Hub now.</p>');
    } catch (err) {
      return sendHtml(res, 500, `<h1>Callback error</h1><pre>${String(err)}</pre>`);
    }
  }

  if (req.method === 'POST' && req.url === '/api/connectors/microsoft/sync') {
    const status = getMicrosoftStatus();
    if (!status.connected) {
      return sendJson(res, 400, {
        ok: false,
        message: 'Microsoft is not connected yet. Complete the auth flow first.'
      });
    }

    try {
      const tokenStore = await refreshAccessTokenIfNeeded();
      const accessToken = tokenStore?.access_token;
      if (!accessToken) {
        return sendJson(res, 500, { ok: false, message: 'No access token available after refresh.' });
      }

      const [me, messages, events, drive] = await Promise.all([
        graphGet('/v1.0/me', accessToken),
        graphGet('/v1.0/me/messages?$top=10&$select=id,subject,receivedDateTime,webLink,from', accessToken),
        graphGet('/v1.0/me/events?$top=10&$select=id,subject,start,end,webLink&$orderby=start/dateTime', accessToken),
        graphGet('/v1.0/me/drive/root/children?$top=20&$select=id,name,webUrl,lastModifiedDateTime,folder,file', accessToken)
      ]);

      const failures = [me, messages, events, drive].filter((r) => r.status >= 400);
      if (failures.length) {
        return sendJson(res, 502, {
          ok: false,
          message: 'One or more Microsoft Graph calls failed.',
          failures: failures.map((r) => r.json)
        });
      }

      const snapshot = {
        synced_at: new Date().toISOString(),
        profile: {
          displayName: me.json.displayName || null,
          userPrincipalName: me.json.userPrincipalName || null,
          mail: me.json.mail || null,
          id: me.json.id || null
        },
        summary: {
          recentMessages: (messages.json.value || []).length,
          upcomingEvents: (events.json.value || []).length,
          driveItems: (drive.json.value || []).length
        },
        mail: summarizeMail(messages.json.value),
        calendar: summarizeEvents(events.json.value),
        drive: summarizeDrive(drive.json.value)
      };

      saveSyncStore(snapshot);

      return sendJson(res, 200, {
        ok: true,
        message: 'Microsoft sync completed.',
        snapshot
      });
    } catch (err) {
      return sendJson(res, 500, {
        ok: false,
        message: 'Microsoft sync failed.',
        error: String(err)
      });
    }
  }

  return sendJson(res, 404, { error: 'Not found', path: req.url });
});

server.listen(port, () => {
  console.log(`Memory Hub backend listening on http://localhost:${port}`);
});
