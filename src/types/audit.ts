export interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}
