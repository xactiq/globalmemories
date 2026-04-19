import { loadPlatformStore } from './platform-store.js';

export function getConnectorOverview() {
  const store = loadPlatformStore();
  return {
    connectors: store?.connectors || [],
    total: (store?.connectors || []).length,
    healthy: (store?.connectors || []).filter((c) => c.health === 'healthy').length
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
