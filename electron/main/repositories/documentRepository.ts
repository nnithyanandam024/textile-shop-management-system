import Database from 'better-sqlite3';

export interface DocumentCategoryRow {
  id: number;
  name: string;
  code: string;
  description?: string;
  requires_expiry: number;
  requires_verification: number;
  allowed_file_types: string;
  max_file_size_mb: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StaffDocumentRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  category_id: number;
  category_code?: string;
  category_name?: string;
  document_name: string;
  document_number?: string;
  masked_document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  version: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'EXPIRED' | 'REJECTED' | 'DELETED';
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploaded_by?: number;
  verified_by?: number;
  verified_by_name?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  versions?: StaffDocumentVersionRow[];
}

export interface StaffDocumentVersionRow {
  id: number;
  staff_document_id: number;
  version: number;
  file_path: string;
  file_name: string;
  file_size: number;
  uploaded_by?: number;
  upload_reason?: string;
  created_at: string;
}

export class DocumentRepository {
  constructor(private db: Database.Database) {}

  // --- CATEGORIES ---
  getCategories(): DocumentCategoryRow[] {
    return this.db.prepare("SELECT * FROM document_categories WHERE status = 'ACTIVE' ORDER BY id ASC").all() as DocumentCategoryRow[];
  }

  getCategoryByCode(code: string): DocumentCategoryRow | undefined {
    return this.db.prepare('SELECT * FROM document_categories WHERE code = ?').get(code.trim().toUpperCase()) as DocumentCategoryRow | undefined;
  }

  // --- DOCUMENTS ---
  getDocuments(filters?: { staffId?: number; categoryId?: number; verificationStatus?: string; search?: string }): StaffDocumentRow[] {
    let sql = `
      SELECT sd.*, s.staff_code, s.first_name, s.last_name, d.name as department_name,
             dc.code as category_code, dc.name as category_name, u.display_name as verified_by_name
      FROM staff_documents sd
      JOIN staff s ON sd.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      JOIN document_categories dc ON sd.category_id = dc.id
      LEFT JOIN users u ON sd.verified_by = u.id
      WHERE sd.status != 'DELETED'
    `;
    const params: any[] = [];

    if (filters?.staffId) { sql += ' AND sd.staff_id = ?'; params.push(filters.staffId); }
    if (filters?.categoryId) { sql += ' AND sd.category_id = ?'; params.push(filters.categoryId); }
    if (filters?.verificationStatus) { sql += ' AND UPPER(sd.verification_status) = UPPER(?)'; params.push(filters.verificationStatus); }
    if (filters?.search) {
      sql += ' AND (s.staff_code LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR sd.document_name LIKE ? OR sd.document_number LIKE ?)';
      const query = `%${filters.search.trim()}%`;
      params.push(query, query, query, query, query);
    }

    sql += ' ORDER BY sd.id DESC';
    const rows = this.db.prepare(sql).all(...params) as StaffDocumentRow[];

    for (const r of rows) {
      r.masked_document_number = this.maskDocumentNumber(r.document_number);
    }
    return rows;
  }

  getDocumentById(id: number): StaffDocumentRow | undefined {
    const row = this.db.prepare(`
      SELECT sd.*, s.staff_code, s.first_name, s.last_name, d.name as department_name,
             dc.code as category_code, dc.name as category_name, u.display_name as verified_by_name
      FROM staff_documents sd
      JOIN staff s ON sd.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      JOIN document_categories dc ON sd.category_id = dc.id
      LEFT JOIN users u ON sd.verified_by = u.id
      WHERE sd.id = ?
    `).get(id) as StaffDocumentRow | undefined;

    if (row) {
      row.masked_document_number = this.maskDocumentNumber(row.document_number);
      row.versions = this.db.prepare('SELECT * FROM staff_document_versions WHERE staff_document_id = ? ORDER BY version DESC').all(row.id) as StaffDocumentVersionRow[];
    }
    return row;
  }

  private maskDocumentNumber(docNum?: string): string {
    if (!docNum || docNum.trim() === '') return '';
    const clean = docNum.trim();
    if (clean.length <= 4) return 'XXXX-' + clean;
    return 'XXXX-XXXX-' + clean.slice(-4);
  }

  saveDocument(input: {
    staff_id: number;
    category_id: number;
    document_name: string;
    document_number?: string;
    issue_date?: string;
    expiry_date?: string;
    file_path: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    uploaded_by?: number;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO staff_documents (
        staff_id, category_id, document_type, document_name, document_number, issue_date, expiry_date,
        file_path, file_name, file_size, mime_type, version, status, verification_status, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ACTIVE', 'Pending', ?)
    `).run(
      input.staff_id, input.category_id, input.document_name.trim(), input.document_name.trim(), input.document_number?.trim() || null,
      input.issue_date || null, input.expiry_date || null, input.file_path, input.file_name,
      input.file_size, input.mime_type, input.uploaded_by || null
    );
    return Number(info.lastInsertRowid);
  }

  verifyDocument(id: number, verifiedBy?: number): void {
    this.db.prepare(`
      UPDATE staff_documents
      SET verification_status = 'Verified', verified_by = ?, verified_at = CURRENT_TIMESTAMP, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(verifiedBy || null, id);
  }

  rejectDocument(id: number, reason: string, verifiedBy?: number): void {
    this.db.prepare(`
      UPDATE staff_documents
      SET verification_status = 'Rejected', verified_by = ?, verified_at = CURRENT_TIMESTAMP, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(verifiedBy || null, reason.trim(), id);
  }

  replaceDocumentVersion(id: number, newFile: {
    file_path: string;
    file_name: string;
    file_size: number;
    uploaded_by?: number;
    upload_reason?: string;
  }): void {
    const doc = this.getDocumentById(id);
    if (!doc) return;

    const replaceTx = this.db.transaction(() => {
      // 1. Archive current version
      this.db.prepare(`
        INSERT INTO staff_document_versions (staff_document_id, version, file_path, file_name, file_size, uploaded_by, upload_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(doc.id, doc.version, doc.file_path, doc.file_name, doc.file_size, doc.uploaded_by || null, newFile.upload_reason || 'Document Replacement');

      // 2. Update to new version v+1
      this.db.prepare(`
        UPDATE staff_documents SET
          file_path = ?, file_name = ?, file_size = ?, version = version + 1,
          verification_status = 'Pending', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newFile.file_path, newFile.file_name, newFile.file_size, id);
    });

    replaceTx();
  }

  logAccess(documentId: number, userId: number | undefined, action: string): void {
    this.db.prepare(`
      INSERT INTO document_access_logs (document_id, user_id, action)
      VALUES (?, ?, ?)
    `).run(documentId, userId || null, action);
  }
}
