import bcrypt from 'bcryptjs';

export class PasswordService {
  private static SALT_ROUNDS = 10;

  static async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }

  // Synchronous helpers for better-sqlite3 transaction callbacks if needed
  static hashPasswordSync(password: string): string {
    return bcrypt.hashSync(password, this.SALT_ROUNDS);
  }

  static verifyPasswordSync(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }
}
