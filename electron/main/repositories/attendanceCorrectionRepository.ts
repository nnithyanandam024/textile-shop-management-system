import Database from 'better-sqlite3';

export interface AttendanceCorrectionRow {
  id: number;
  attendance_id: number;
  original_check_in?: string;
  original_check_out?: string;
  original_status?: string;
  new_check_in?: string;
  new_check_out?: string;
  new_status?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: number;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  // Joined fields
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  attendance_date?: string;
  requested_by_name?: string;
}

export class AttendanceCorrectionRepository {
  constructor(private db: Database.Database) {}

  create(corr: Partial<AttendanceCorrectionRow>): number {
    const info = this.db.prepare(`
      INSERT INTO attendance_corrections (
        attendance_id, original_check_in, original_check_out, original_status,
        new_check_in, new_check_out, new_status, reason, status, requested_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      corr.attendance_id,
      corr.original_check_in || null,
      corr.original_check_out || null,
      corr.original_status || null,
      corr.new_check_in || null,
      corr.new_check_out || null,
      corr.new_status || null,
      corr.reason,
      corr.requested_by
    );
    return Number(info.lastInsertRowid);
  }

  getPending(): AttendanceCorrectionRow[] {
    return this.db.prepare(`
      SELECT ac.*, a.attendance_date, s.staff_code, s.first_name, s.last_name, u.display_name as requested_by_name
      FROM attendance_corrections ac
      JOIN attendance a ON ac.attendance_id = a.id
      JOIN staff s ON a.staff_id = s.id
      LEFT JOIN users u ON ac.requested_by = u.id
      WHERE ac.status = 'PENDING'
      ORDER BY ac.created_at DESC
    `).all() as AttendanceCorrectionRow[];
  }

  getById(id: number): AttendanceCorrectionRow | undefined {
    return this.db.prepare('SELECT * FROM attendance_corrections WHERE id = ?').get(id) as AttendanceCorrectionRow | undefined;
  }

  updateStatus(id: number, status: 'APPROVED' | 'REJECTED', reviewedBy: number): void {
    this.db.prepare(`
      UPDATE attendance_corrections
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, reviewedBy, id);
  }
}
