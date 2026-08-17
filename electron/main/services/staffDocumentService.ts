import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { StaffDocumentRepository, StaffDocumentRow } from '../repositories/staffDocumentRepository';
import { StaffRepository } from '../repositories/staffRepository';
import { AuditRepository } from '../repositories/auditRepository';

export interface UploadDocumentInput {
  staff_id: number;
  document_type: string;
  file_name: string;
  file_base64: string; // base64 payload
}

export class StaffDocumentService {
  private docRepo: StaffDocumentRepository;
  private staffRepo: StaffRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.docRepo = new StaffDocumentRepository(db);
    this.staffRepo = new StaffRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private getStaffDocumentDirectory(staffCode: string): string {
    const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
    const docDir = path.join(userDataPath, 'staff_documents', staffCode);
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
    return docDir;
  }

  getDocuments(staffId: number): StaffDocumentRow[] {
    return this.docRepo.getByStaffId(staffId);
  }

  uploadDocument(input: UploadDocumentInput, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    const staff = this.staffRepo.getById(input.staff_id);
    if (!staff) return { success: false, error: 'Staff member not found.' };

    if (!input.document_type || input.document_type.trim() === '') {
      return { success: false, error: 'Document category is required.' };
    }
    if (!input.file_name || !input.file_base64) {
      return { success: false, error: 'File content is required.' };
    }

    try {
      const match = input.file_base64.match(/^data:(.+);base64,(.+)$/);
      let mimeType = 'application/octet-stream';
      let base64Data = input.file_base64;

      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > 10 * 1024 * 1024) {
        return { success: false, error: 'File size exceeds maximum limit of 10MB.' };
      }

      const ext = path.extname(input.file_name) || '.dat';
      const cleanFileName = `${Date.now()}_${input.file_name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const docDir = this.getStaffDocumentDirectory(staff.staff_code);
      const filePath = path.join(docDir, cleanFileName);

      fs.writeFileSync(filePath, buffer);

      const docId = this.docRepo.create({
        staff_id: input.staff_id,
        document_type: input.document_type,
        file_name: input.file_name,
        file_path: filePath,
        file_size: buffer.length,
        mime_type: mimeType,
        uploaded_by: actorUserId,
      });

      this.auditRepo.log({
        user_id: actorUserId,
        action: 'STAFF_DOCUMENT_UPLOADED',
        entity_type: 'STAFF',
        entity_id: input.staff_id,
        new_value: `Uploaded document: ${input.file_name} (${input.document_type})`,
      });

      return { success: true, id: docId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save document file.' };
    }
  }

  verifyDocument(id: number, status: 'Pending' | 'Verified' | 'Rejected', actorUserId?: number): { success: boolean; error?: string } {
    const doc = this.docRepo.getById(id);
    if (!doc) return { success: false, error: 'Document record not found.' };

    this.docRepo.updateVerificationStatus(id, status, actorUserId);
    this.auditRepo.log({
      user_id: actorUserId,
      action: 'STAFF_DOCUMENT_VERIFIED',
      entity_type: 'STAFF',
      entity_id: doc.staff_id,
      new_value: `Document ${doc.file_name} status changed to ${status}`,
    });

    return { success: true };
  }

  deleteDocument(id: number, actorUserId?: number): { success: boolean; error?: string } {
    const doc = this.docRepo.getById(id);
    if (!doc) return { success: false, error: 'Document record not found.' };

    if (fs.existsSync(doc.file_path)) {
      try {
        fs.unlinkSync(doc.file_path);
      } catch (err) {
        // file unlinking error ignored if missing
      }
    }

    this.docRepo.delete(id);
    this.auditRepo.log({
      user_id: actorUserId,
      action: 'STAFF_DOCUMENT_DELETED',
      entity_type: 'STAFF',
      entity_id: doc.staff_id,
      new_value: `Deleted document: ${doc.file_name}`,
    });

    return { success: true };
  }
}
