import Database from 'better-sqlite3';

export interface StaffDocumentRow {
  id: number;
  staff_id: number;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  uploaded_by?: number;
  uploader_name?: string;
  uploaded_at: string;
  verified_by?: number;
  verifier_name?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export class StaffDocumentRepository {
  constructor(private db: Database.Database) {}

  getByStaffId(staffId: number): StaffDocumentRow[] {
    return this.db.prepare(`
      SELECT d.*, 
             u1.display_name as uploader_name,
             u2.display_name as verifier_name
      FROM staff_documents d
      LEFT JOIN users u1 ON d.uploaded_by = u1.id
      LEFT JOIN users u2 ON d.verified_by = u2.id
      WHERE d.staff_id = ?
      ORDER BY d.id DESC
    `).all(staffId) as StaffDocumentRow[];
  }

  getById(id: number): StaffDocumentRow | undefined {
    return this.db.prepare('SELECT * FROM staff_documents WHERE id = ?').get(id) as StaffDocumentRow | undefined;
  }

  create(doc: {
    staff_id: number;
    document_type: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO staff_documents (staff_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      doc.staff_id,
      doc.document_type.trim(),
      doc.file_name.trim(),
      doc.file_path,
      doc.file_size,
      doc.mime_type,
      doc.uploaded_by || null
    );
    return Number(info.lastInsertRowid);
  }

  updateVerificationStatus(id: number, status: 'Pending' | 'Verified' | 'Rejected', verifiedBy?: number): void {
    this.db.prepare(`
      UPDATE staff_documents 
      SET verification_status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, verifiedBy || null, id);
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM staff_documents WHERE id = ?').run(id);
  }
}
