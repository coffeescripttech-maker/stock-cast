import type { RowDataPacket } from 'mysql2';

export interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  display_name: string;
  role: 'owner' | 'staff';
  is_active: number | boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/** A user row that also carries the hash — only used internally (login, change-password). */
export interface UserWithHash extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: 'owner' | 'staff';
}