import Database from 'better-sqlite3';
import { StaffNotesRepository, StaffNoteRow } from '../repositories/staffNotesRepository';
import { AuditRepository } from '../repositories/auditRepository';

export interface CreateStaffNoteInput {
  staff_id: number;
  note: string;
}

export class StaffNotesService {
  private repo: StaffNotesRepository;
  private auditRepo: AuditRepository;

  constructor(private db: Database.Database) {
    this.repo = new StaffNotesRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  getNotes(staffId: number): StaffNoteRow[] {
    return this.repo.getByStaffId(staffId);
  }

  addNote(input: CreateStaffNoteInput, actorUserId?: number): { success: boolean; id?: number; error?: string } {
    if (!input.note || input.note.trim() === '') {
      return { success: false, error: 'Note content cannot be empty.' };
    }

    const noteId = this.repo.create({
      staff_id: input.staff_id,
      note: input.note,
      created_by: actorUserId,
    });

    this.auditRepo.log({
      user_id: actorUserId,
      action: 'STAFF_NOTE_CREATED',
      entity_type: 'STAFF',
      entity_id: input.staff_id,
      new_value: `Added internal staff note`,
    });

    return { success: true, id: noteId };
  }

  deleteNote(id: number, actorUserId?: number): { success: boolean; error?: string } {
    this.repo.delete(id);
    this.auditRepo.log({
      user_id: actorUserId,
      action: 'STAFF_NOTE_CREATED',
      entity_type: 'STAFF',
      entity_id: id,
      new_value: `Deleted internal staff note`,
    });
    return { success: true };
  }
}
