export interface UserAccount {
  password: string;
  role: 'owner' | 'staff';
  name: string;
}

export interface UserSession {
  id?: number;
  username: string;
  role: 'owner' | 'staff';
  /** Server returns `display_name` → client transform maps it to `displayName`. */
  displayName: string;
}

/** A user row from the owner-only Users & Security management list. */
export interface PosUser {
  id: number;
  username: string;
  displayName: string;
  role: 'owner' | 'staff';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}