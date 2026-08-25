import Database from 'better-sqlite3';

export class InvoiceSequenceRepository {
  constructor(private db: Database.Database) {}

  /**
   * Generates the next sequential, lock-safe invoice number.
   * Format: INV-YYYY-00001 (5-digit padded sequence per calendar year)
   */
  getNextInvoiceNumber(prefix: string = 'INV'): string {
    const currentYear = new Date().getFullYear();

    const generate = this.db.transaction(() => {
      // Ensure sequence record exists for year and prefix
      this.db.prepare(`
        INSERT OR IGNORE INTO invoice_sequences (year, prefix, current_seq)
        VALUES (?, ?, 0)
      `).run(currentYear, prefix);

      // Increment sequence atomically
      this.db.prepare(`
        UPDATE invoice_sequences
        SET current_seq = current_seq + 1, updated_at = CURRENT_TIMESTAMP
        WHERE year = ? AND prefix = ?
      `).run(currentYear, prefix);

      const row = this.db.prepare(`
        SELECT current_seq FROM invoice_sequences
        WHERE year = ? AND prefix = ?
      `).get(currentYear, prefix) as { current_seq: number };

      const seqNum = row?.current_seq || 1;
      const paddedSeq = String(seqNum).padStart(5, '0');
      return `${prefix}-${currentYear}-${paddedSeq}`;
    });

    return generate();
  }

  /**
   * Peeks the next expected invoice number without incrementing
   */
  peekNextInvoiceNumber(prefix: string = 'INV'): string {
    const currentYear = new Date().getFullYear();
    const row = this.db.prepare(`
      SELECT current_seq FROM invoice_sequences
      WHERE year = ? AND prefix = ?
    `).get(currentYear, prefix) as { current_seq: number } | undefined;

    const nextSeq = (row?.current_seq || 0) + 1;
    const paddedSeq = String(nextSeq).padStart(5, '0');
    return `${prefix}-${currentYear}-${paddedSeq}`;
  }
}
