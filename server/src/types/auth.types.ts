// ---- Auth Types ----

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserSession;
  token: string;
}

export interface UserSession {
  id: number;
  username: string;
  display_name: string;
  role: 'owner' | 'staff';
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: 'owner' | 'staff';
  display_name: string;
  iat: number;
  exp: number;
}

// Express augment — attach user to request after auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}
