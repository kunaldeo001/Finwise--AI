/**
 * Lightweight Financial Audit Trail
 * Logs auditable events for regulatory traceability without storing credentials or PII.
 */

export type AuditActionType =
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_EDITED'
  | 'TRANSACTION_DELETED'
  | 'BUDGET_CREATED'
  | 'BUDGET_UPDATED'
  | 'GOAL_CREATED'
  | 'GOAL_CONTRIBUTED'
  | 'INVESTMENT_UPDATED'
  | 'DEBT_UPDATED'
  | 'CSV_IMPORTED'
  | 'REPORT_GENERATED'
  | 'MONTH_REVIEWED'
  | 'DATA_EXPORTED'
  | 'RECORDS_RESET';

export interface AuditEvent {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const AUDIT_STORAGE_KEY = 'finwise_audit_log';
let inMemoryAuditLog: AuditEvent[] = [];

export function logAuditEvent(
  action: string,
  entityOrUser: string,
  entityOrId: string,
  metadataOrEntityId?: any,
  maybeMetadata?: any
): AuditEvent {
  let userId: string | undefined = undefined;
  let entity = entityOrUser;
  let entityId = entityOrId;
  let metadata = metadataOrEntityId;

  if (typeof metadataOrEntityId === 'object' && maybeMetadata === undefined && (entityOrUser.startsWith('user') || entityOrUser.includes('-'))) {
    userId = entityOrUser;
    entity = entityOrId;
    entityId = entityOrId;
    metadata = metadataOrEntityId;
  }

  const event: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action: action as any,
    entity,
    entityId,
    userId,
    timestamp: new Date().toISOString(),
    metadata,
  };

  inMemoryAuditLog = [event, ...inMemoryAuditLog].slice(0, 100);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(inMemoryAuditLog));
    } catch {
      // Graceful fallback if storage unavailable
    }
  }

  return event;
}

export function getAuditTrail(): AuditEvent[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }
  }
  return inMemoryAuditLog;
}

export function clearAuditTrail(): void {
  inMemoryAuditLog = [];
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
  }
}
