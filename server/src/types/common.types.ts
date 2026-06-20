import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// ---- Pagination ----

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ---- API Response Envelope ----

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

// ---- Utility type for MySQL rows ----

export type MySqlRow = RowDataPacket;
export type MySqlOk = ResultSetHeader;
