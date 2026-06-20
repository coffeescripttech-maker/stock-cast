export interface UserAccount {
  password: string;
  role: 'owner' | 'staff';
  name: string;
}

export interface UserSession {
  id?: number;
  username: string;
  role: 'owner' | 'staff';
  name: string;
}
