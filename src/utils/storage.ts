export interface UserSessionData {
  id: string | number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  roleId?: number;
  staffId?: number;
  permissions: string[];
  lastActiveAt?: string;
}

const STORAGE_KEYS = {
  TOKEN: 'texora_auth_token',
  USER: 'texora_auth_user',
  PERMISSIONS: 'texora_auth_permissions',
  SESSION_EXPIRY: 'texora_session_expiry',
} as const;

export class StorageManager {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Token Management
   */
  public static getToken(): string | null {
    if (!this.isBrowser()) return null;
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
      return null;
    }
  }

  public static setToken(token: string, expiresInMs: number = 86400000): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      const expiry = Date.now() + expiresInMs;
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expiry.toString());
    } catch (err) {
      console.error('Failed to store auth token in local storage:', err);
    }
  }

  public static removeToken(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
    } catch {}
  }

  /**
   * User Data Management (Strictly strips passwords)
   */
  public static getCurrentUser(): UserSessionData | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) return null;
      return JSON.parse(raw) as UserSessionData;
    } catch {
      return null;
    }
  }

  public static setCurrentUser(user: UserSessionData): void {
    if (!this.isBrowser()) return;
    try {
      // Create a sanitized clone ensuring NO password/password_hash is stored
      const sanitized: UserSessionData = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleId: user.roleId,
        staffId: user.staffId,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        lastActiveAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sanitized));
      this.setPermissions(sanitized.permissions);
    } catch (err) {
      console.error('Failed to store user session in local storage:', err);
    }
  }

  public static removeCurrentUser(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
  }

  /**
   * Permissions Management
   */
  public static getPermissions(): string[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  public static setPermissions(permissions: string[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
    } catch {}
  }

  /**
   * Authentication State
   */
  public static isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    const token = this.getToken();
    const user = this.getCurrentUser();
    const expiryStr = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);

    if (!token || !user) return false;

    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (!isNaN(expiry) && Date.now() > expiry) {
        this.clearSession();
        return false;
      }
    }

    return true;
  }

  /**
   * Clear Complete Active Session
   */
  public static clearSession(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
      localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
    } catch {}
  }
}

export default StorageManager;
