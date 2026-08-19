import Database from 'better-sqlite3';
import { DocumentRepository, DocumentCategoryRow, StaffDocumentRow } from '../repositories/documentRepository';
import { DocumentStorageService } from './documentStorageService';
import { StaffRepository } from '../repositories/staffRepository';
import { AuditRepository } from '../repositories/auditRepository';

export class DocumentService {
  private docRepo: DocumentRepository;
  private storageService: DocumentStorageService;
  private staffRepo: StaffRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.docRepo = new DocumentRepository(db);
    this.storageService = new DocumentStorageService();
    this.staffRepo = new StaffRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  private sanitizeActorUserId(actorUserId?: number): number | undefined {
    if (!actorUserId) return undefined;
    const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(actorUserId);
    return user ? actorUserId : undefined;
  }

  // --- CATEGORIES ---
  getCategories(): DocumentCategoryRow[] {
    return this.docRepo.getCategories();
  }

  // --- DOCUMENTS ---
  getDocuments(filters?: { staffId?: number; categoryId?: number; verificationStatus?: string; search?: string }): StaffDocumentRow[] {
    return this.docRepo.getDocuments(filters);
  }

  getDocumentById(id: number, actorUserId?: number): StaffDocumentRow | undefined {
    const doc = this.docRepo.getDocumentById(id);
    if (doc) {
      this.docRepo.logAccess(doc.id, this.sanitizeActorUserId(actorUserId), 'VIEW');
    }
    return doc;
  }

  uploadDocument(input: {
    staff_id: number;
    category_id: number;
    document_name: string;
    document_number?: string;
    issue_date?: string;
    expiry_date?: string;
    file_name: string;
    buffer: Buffer;
  }, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.staff_id) return { success: false, error: 'Staff member is required.' };
    if (!input.category_id) return { success: false, error: 'Document category is required.' };
    if (!input.document_name || input.document_name.trim() === '') return { success: false, error: 'Document name is required.' };
    if (!input.buffer || input.buffer.length === 0) return { success: false, error: 'File buffer is empty.' };

    const staff = this.staffRepo.getById(input.staff_id);
    if (!staff) return { success: false, error: 'Staff member not found.' };

    const validActor = this.sanitizeActorUserId(actorUserId);

    // Save physical file via DocumentStorageService
    const fileResult = this.storageService.saveDocumentFile({
      staffCode: staff.staff_code,
      originalFileName: input.file_name,
      buffer: input.buffer,
    });

    const id = this.docRepo.saveDocument({
      staff_id: input.staff_id,
      category_id: input.category_id,
      document_name: input.document_name,
      document_number: input.document_number,
      issue_date: input.issue_date,
      expiry_date: input.expiry_date,
      file_path: fileResult.relativePath,
      file_name: fileResult.fileName,
      file_size: fileResult.fileSize,
      mime_type: fileResult.mimeType,
      uploaded_by: validActor,
    });

    this.docRepo.logAccess(id, validActor, 'UPLOAD');

    this.auditRepo.log({
      user_id: validActor,
      action: 'DOCUMENT_UPLOADED',
      entity_type: 'STAFF_DOCUMENT',
      entity_id: id,
      new_value: `Uploaded document '${input.document_name}' for ${staff.staff_code}`,
    });

    return { success: true, id };
  }

  readDocumentBase64(documentId: number, actorUserId?: number): { success: boolean; base64?: string; mimeType?: string; error?: string } {
    const doc = this.docRepo.getDocumentById(documentId);
    if (!doc) return { success: false, error: 'Document not found.' };

    const validActor = this.sanitizeActorUserId(actorUserId);
    this.docRepo.logAccess(doc.id, validActor, 'DOWNLOAD');

    try {
      const res = this.storageService.readDocumentAsBase64(doc.file_path);
      return { success: true, base64: res.base64, mimeType: res.mimeType };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to read document file.' };
    }
  }

  verifyDocument(documentId: number, actorUserId?: number): { success: boolean; error?: string } {
    const doc = this.docRepo.getDocumentById(documentId);
    if (!doc) return { success: false, error: 'Document not found.' };

    const validActor = this.sanitizeActorUserId(actorUserId);
    this.docRepo.verifyDocument(documentId, validActor);
    this.docRepo.logAccess(documentId, validActor, 'VERIFY');

    this.auditRepo.log({
      user_id: validActor,
      action: 'DOCUMENT_VERIFIED',
      entity_type: 'STAFF_DOCUMENT',
      entity_id: documentId,
      new_value: `Verified document '${doc.document_name}'`,
    });

    return { success: true };
  }

  rejectDocument(documentId: number, reason: string, actorUserId?: number): { success: boolean; error?: string } {
    if (!reason || reason.trim() === '') return { success: false, error: 'Rejection reason is required.' };

    const doc = this.docRepo.getDocumentById(documentId);
    if (!doc) return { success: false, error: 'Document not found.' };

    const validActor = this.sanitizeActorUserId(actorUserId);
    this.docRepo.rejectDocument(documentId, reason, validActor);
    this.docRepo.logAccess(documentId, validActor, 'REJECT');

    this.auditRepo.log({
      user_id: validActor,
      action: 'DOCUMENT_REJECTED',
      entity_type: 'STAFF_DOCUMENT',
      entity_id: documentId,
      new_value: `Rejected document '${doc.document_name}' reason: ${reason}`,
    });

    return { success: true };
  }

  replaceDocument(documentId: number, input: { file_name: string; buffer: Buffer; reason?: string }, actorUserId?: number): { success: boolean; error?: string } {
    const doc = this.docRepo.getDocumentById(documentId);
    if (!doc) return { success: false, error: 'Document not found.' };

    const staff = this.staffRepo.getById(doc.staff_id);
    if (!staff) return { success: false, error: 'Staff member not found.' };

    const validActor = this.sanitizeActorUserId(actorUserId);

    const fileResult = this.storageService.saveDocumentFile({
      staffCode: staff.staff_code,
      originalFileName: input.file_name,
      buffer: input.buffer,
    });

    this.docRepo.replaceDocumentVersion(documentId, {
      file_path: fileResult.relativePath,
      file_name: fileResult.fileName,
      file_size: fileResult.fileSize,
      uploaded_by: validActor,
      upload_reason: input.reason || 'Document Replacement',
    });

    this.docRepo.logAccess(documentId, validActor, 'REPLACE');

    this.auditRepo.log({
      user_id: validActor,
      action: 'DOCUMENT_REPLACED',
      entity_type: 'STAFF_DOCUMENT',
      entity_id: documentId,
      new_value: `Replaced version for '${doc.document_name}' to v${doc.version + 1}`,
    });

    return { success: true };
  }

  // --- EXPIRY & COMPLIANCE ---
  getExpiringDocuments(thresholdDays: number = 30): Array<StaffDocumentRow & { expiry_status: 'EXPIRING_SOON' | 'EXPIRED' }> {
    const docs = this.docRepo.getDocuments();
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + thresholdDays);

    const result: Array<StaffDocumentRow & { expiry_status: 'EXPIRING_SOON' | 'EXPIRED' }> = [];

    for (const d of docs) {
      if (d.expiry_date) {
        const exp = new Date(d.expiry_date);
        if (exp < today) {
          result.push({ ...d, expiry_status: 'EXPIRED' });
        } else if (exp <= thresholdDate) {
          result.push({ ...d, expiry_status: 'EXPIRING_SOON' });
        }
      }
    }

    return result;
  }

  getStaffCompliance(staffId: number): { totalRequired: number; completedCount: number; complianceScore: number; missingCategories: string[] } {
    const reqRows = this.db.prepare(`
      SELECT rsd.*, dc.code, dc.name
      FROM required_staff_documents rsd
      JOIN document_categories dc ON rsd.category_id = dc.id
      WHERE rsd.is_required = 1 AND rsd.status = 'ACTIVE'
    `).all() as any[];

    const staffDocs = this.docRepo.getDocuments({ staffId, verificationStatus: 'Verified' });
    const uploadedCatIds = new Set(staffDocs.map((d) => d.category_id));

    let completedCount = 0;
    const missingCategories: string[] = [];

    for (const r of reqRows) {
      if (uploadedCatIds.has(r.category_id)) {
        completedCount += 1;
      } else {
        missingCategories.push(r.name);
      }
    }

    const totalRequired = reqRows.length || 4;
    const complianceScore = Math.round((completedCount / totalRequired) * 100);

    return {
      totalRequired,
      completedCount,
      complianceScore,
      missingCategories,
    };
  }
}
