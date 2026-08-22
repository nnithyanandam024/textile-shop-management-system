export interface AuthUserSession {
  userId: number;
  username: string;
  displayName: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  staffId?: number;
  status?: string;
  token?: string;
}

export class SessionService {
  private static currentSession: AuthUserSession | null = null;

  static setSession(user: AuthUserSession) {
    this.currentSession = user;
  }

  static getSession(): AuthUserSession | null {
    return this.currentSession;
  }

  static clearSession() {
    this.currentSession = null;
  }

  static isAuthenticated(): boolean {
    return this.currentSession !== null;
  }
}
