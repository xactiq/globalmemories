import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadPlatformStore } from './platform-store.js';

const appRoot = join(process.cwd(), '..');
const workspaceRoot = join(appRoot, '..');
const memoryDir = join(workspaceRoot, 'memory');
const canonicalStorePath = join(appRoot, 'canonical-memory.example.json');
const hubDataPath = join(appRoot, 'hub-data.json');
const googleSyncPath = join(process.cwd(), '.google-sync.json');
const microsoftSyncPath = join(process.cwd(), '.microsoft-sync.json');

function readJsonSafe(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function getFileMeta(path) {
  if (!existsSync(path)) return null;
  try {
    const stat = statSync(path);
    return {
      path,
      exists: true,
      size: stat.size,
      updatedAt: stat.mtime.toISOString()
    };
  } catch {
    return null;
  }
}

function summarizeCanonicalCounts(store) {
  return {
    workspaces: (store?.workspaces || []).length,
    sources: (store?.sources || []).length,
    memories: (store?.memories || []).length,
    entities: (store?.entities || []).length,
    relationships: (store?.relationships || []).length,
    connectors: (store?.connectors || []).length,
    syncJobs: (store?.syncJobs || []).length,
    auditEvents: (store?.auditEvents || []).length
  };
}

function recentMemoryFiles(limit = 6) {
  if (!existsSync(memoryDir)) return [];
  try {
    return readdirSync(memoryDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => {
        const path = join(memoryDir, name);
        const meta = getFileMeta(path);
        return {
          name,
          ...meta
        };
      })
      .filter(Boolean)
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
      .slice(0, limit);
  } catch {
    return [];
  }
}

function sourcePreview(source) {
  return {
    sourceId: source.sourceId,
    provider: source.provider,
    kind: source.kind,
    title: source.title || source.externalId || source.sourceId,
    updatedAt: source.updatedAt || source.createdAt || null,
    url: source.url || null,
    author: source.author || null
  };
}

function memoryPreview(memory) {
  return {
    memoryId: memory.memoryId,
    title: memory.title,
    summary: memory.summary,
    memoryType: memory.memoryType,
    importance: memory.importance,
    updatedAt: memory.updatedAt || memory.createdAt || null,
    tags: memory.tags || [],
    sourceCount: (memory.sourceRefs || []).length
  };
}

function auditPreview(event) {
  return {
    auditEventId: event.auditEventId,
    action: event.action,
    actorType: event.actorType,
    actorId: event.actorId,
    targetType: event.targetType,
    targetId: event.targetId,
    createdAt: event.createdAt || null
  };
}

function connectorHealthSummary(connectors = []) {
  const total = connectors.length;
  const healthy = connectors.filter((c) => c.health === 'healthy').length;
  const degraded = connectors.filter((c) => ['degraded', 'partial', 'experimental'].includes(c.health)).length;
  const offline = connectors.filter((c) => ['offline', 'unknown', 'disconnected', 'failed'].includes(c.health)).length;
  return { total, healthy, degraded, offline };
}

export function getConnectorOverview(connectorsOverride = null) {
  const store = loadPlatformStore();
  const connectors = connectorsOverride || store?.connectors || [];
  const summary = connectorHealthSummary(connectors);
  return {
    connectors,
    ...summary
  };
}

export function getJobOverview() {
  const store = loadPlatformStore();
  return {
    jobs: store?.syncJobs || [],
    total: (store?.syncJobs || []).length,
    running: (store?.syncJobs || []).filter((job) => job.status === 'running').length,
    failed: (store?.syncJobs || []).filter((job) => job.status === 'failed').length
  };
}

export function getAuditOverview() {
  const store = loadPlatformStore();
  return {
    events: store?.auditEvents || [],
    total: (store?.auditEvents || []).length
  };
}

export function buildMissionControlSnapshot({ googleStatus = null, microsoftStatus = null, serverStartedAt = null, port = null, host = null } = {}) {
  const store = loadPlatformStore();
  const hubData = readJsonSafe(hubDataPath);
  const counts = summarizeCanonicalCounts(store);

  const baseConnectors = (store?.connectors || []).map((connector) => ({ ...connector }));
  if (!baseConnectors.length && Array.isArray(hubData?.connectors)) {
    for (const connector of hubData.connectors) {
      baseConnectors.push({
        connectorId: connector.id,
        provider: connector.type,
        status: connector.status,
        health: connector.enabled ? 'healthy' : connector.status || 'unknown',
        label: connector.label,
        notes: connector.notes,
        syncMode: connector.syncMode
      });
    }
  }

  const connectors = baseConnectors.map((connector) => {
    if (connector.connectorId === 'google-workspace' || connector.provider === 'google-workspace') {
      return {
        ...connector,
        health: googleStatus?.connected ? 'healthy' : googleStatus?.configured ? 'degraded' : connector.health || 'unknown',
        liveStatus: googleStatus?.connectors || null,
        lastSyncAt: googleStatus?.lastSyncAt || connector.lastSyncAt || null,
        accountLabel: googleStatus?.accountLabel || null,
        issues: googleStatus?.issues || []
      };
    }
    if (connector.connectorId === 'microsoft-graph' || connector.provider === 'microsoft-graph') {
      return {
        ...connector,
        health: microsoftStatus?.connected ? 'healthy' : microsoftStatus?.configured ? 'degraded' : connector.health || 'unknown',
        liveStatus: microsoftStatus?.connectors || null,
        lastSyncAt: microsoftStatus?.lastSyncAt || connector.lastSyncAt || null,
        accountLabel: microsoftStatus?.accountLabel || null,
        issues: microsoftStatus?.issues || []
      };
    }
    return connector;
  });

  const fileStates = {
    canonicalStore: getFileMeta(canonicalStorePath),
    hubData: getFileMeta(hubDataPath),
    googleSync: getFileMeta(googleSyncPath),
    microsoftSync: getFileMeta(microsoftSyncPath)
  };

  const alerts = [
    !fileStates.canonicalStore?.exists ? {
      level: 'error',
      message: 'Canonical store is missing.'
    } : null,
    googleStatus && !googleStatus.connected ? {
      level: googleStatus.configured ? 'warn' : 'info',
      message: googleStatus.configured ? 'Google Workspace is configured but not currently connected.' : 'Google Workspace is not configured.'
    } : null,
    microsoftStatus && microsoftStatus.partial ? {
      level: 'warn',
      message: 'Microsoft connector is only partially available.'
    } : null,
    fileStates.canonicalStore?.updatedAt ? null : {
      level: 'warn',
      message: 'Canonical store has no recent write timestamp.'
    }
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    runtime: {
      serverStartedAt,
      port,
      host,
      appRoot,
      workspaceRoot
    },
    canonical: {
      counts,
      files: fileStates,
      recentMemories: (store?.memories || [])
        .slice()
        .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
        .slice(0, 8)
        .map(memoryPreview),
      recentSources: (store?.sources || [])
        .slice()
        .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
        .slice(0, 8)
        .map(sourcePreview),
      recentFiles: recentMemoryFiles()
    },
    connectors: {
      ...connectorHealthSummary(connectors),
      items: connectors,
      google: googleStatus,
      microsoft: microsoftStatus
    },
    jobs: {
      ...getJobOverview(),
      recent: (store?.syncJobs || []).slice(0, 10)
    },
    audit: {
      ...getAuditOverview(),
      recent: (store?.auditEvents || []).slice(0, 10).map(auditPreview)
    },
    hub: {
      generatedAt: hubData?.generatedAt || null,
      counts: hubData?.counts || null
    },
    alerts
  };
}
