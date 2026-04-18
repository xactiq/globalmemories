import http from 'node:http';

const port = process.env.MEMORY_HUB_BACKEND_PORT || 8787;

const microsoftStatus = {
  connected: false,
  accountLabel: 'Not connected',
  lastSyncAt: null,
  connectors: {
    outlook: 'planned',
    onedrive: 'planned'
  }
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: 'Missing URL' });
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });

  if (req.method === 'GET' && req.url === '/api/connectors/microsoft/status') {
    return sendJson(res, 200, {
      status: microsoftStatus,
      connect: { url: '/api/connectors/microsoft/connect', method: 'POST' },
      sync: { url: '/api/connectors/microsoft/sync', method: 'POST' }
    });
  }

  if (req.method === 'POST' && req.url === '/api/connectors/microsoft/connect') {
    return sendJson(res, 501, {
      ok: false,
      message: 'Microsoft OAuth flow is not implemented yet. Add tenant, client, redirect, and token exchange logic here.'
    });
  }

  if (req.method === 'GET' && req.url.startsWith('/api/connectors/microsoft/callback')) {
    return sendJson(res, 501, {
      ok: false,
      message: 'Microsoft callback handler is not implemented yet.'
    });
  }

  if (req.method === 'POST' && req.url === '/api/connectors/microsoft/sync') {
    return sendJson(res, 501, {
      ok: false,
      message: 'Microsoft sync is not implemented yet. This endpoint will later pull Outlook and OneDrive data.'
    });
  }

  return sendJson(res, 404, { error: 'Not found', path: req.url });
});

server.listen(port, () => {
  console.log(`Memory Hub backend listening on http://localhost:${port}`);
});
