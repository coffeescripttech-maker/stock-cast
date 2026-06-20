// ---- Audit Types ----

export interface AuditEntryRow {
  id: number;
  action: string;
  details: string;
  user_name: string;
  user_role: string;
  created_at: string;
}

export interface AuditFilterParams {
  search?: string;
  action?: string;
  page?: number;
  limit?: number;
}
