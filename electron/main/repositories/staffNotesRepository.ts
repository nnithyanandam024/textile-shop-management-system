import Database from 'better-sqlite3';

export interface StaffNoteRow {
  id: number;
  staff_id: number;
  note: string;
  created_by?: number;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export class StaffNotesRepository {
  constructor(private db: Database.Database) {}

  getByStaffId(staffId: number): StaffNoteRow[] {
    return this.db.prepare(`
      SELECT n.*, u.display_name as author_name
      FROM staff_notes n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.staff_id = ?
      ORDER BY n.id DESC
    `).all(staffId) as StaffNoteRow[];
  }

  create(note: { staff_id: number; note: string; created_by?: number }): number {
    const info = this.db.prepare(`
      INSERT INTO staff_notes (staff_id, note, created_by)
      VALUES (?, ?, ?)
    `).run(note.staff_id, note.note.trim(), note.created_by || null);
    return Number(info.lastInsertRowid);
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM staff_notes WHERE id = ?').run(id);
  }
}
