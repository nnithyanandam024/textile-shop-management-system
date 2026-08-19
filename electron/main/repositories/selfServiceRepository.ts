import Database from 'better-sqlite3';

export interface ProfileChangeRequestRow {
  id: number;
  staff_id: number;
  field_name: string;
  old_value?: string;
  new_value: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
}

export interface AttendanceCorrectionRequestRow {
  id: number;
  staff_id: number;
  attendance_id?: number;
  date: string;
  requested_check_in?: string;
  requested_check_out?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
}

export class SelfServiceRepository {
  constructor(private db: Database.Database) {}

  getStaffByUserId(userId: number): any {
    return this.db.prepare(`
      SELECT s.*, 
             dep.name as department_name, dep.department_code,
             des.name as designation_name, des.designation_code,
             (mgr.first_name || ' ' || COALESCE(mgr.last_name, '')) as manager_name,
             u.username, u.display_name as user_display_name
      FROM staff s
      LEFT JOIN departments dep ON s.department_id = dep.id
      LEFT JOIN designations des ON s.designation_id = des.id
      LEFT JOIN staff mgr ON s.manager_id = mgr.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `).get(userId);
  }

  // --- DASHBOARD SUMMARY ---
  getDashboardSummary(userId: number): {
    profile: any;
    todayAttendance: any;
    todayShift: any;
    leaveBalance: { used: number; total: number; remaining: number };
    documentCompletion: { totalRequired: number; completedCount: number; complianceScore: number };
    unreadNotificationsCount: number;
  } {
    const staff = this.getStaffByUserId(userId);
    const staffId = staff?.id || -1;
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Today Attendance
    const todayAttendance = this.db.prepare(`
      SELECT * FROM attendance WHERE staff_id = ? AND attendance_date = ?
    `).get(staffId, todayStr);

    // 2. Today Shift
    const todayShift = this.db.prepare(`
      SELECT s.*, st.name as shift_name, st.start_time, st.end_time
      FROM staff_shift_assignments s
      JOIN shift_templates st ON s.shift_template_id = st.id
      WHERE s.staff_id = ? AND ? BETWEEN s.effective_from AND COALESCE(s.effective_to, '9999-12-31')
      ORDER BY s.id DESC LIMIT 1
    `).get(staffId, todayStr);

    // 3. Leave Balance
    const leaveRow = this.db.prepare(`
      SELECT 
        COALESCE(SUM(duration_days), 0) as used
      FROM leave_requests
      WHERE staff_id = ? AND status = 'APPROVED'
    `).get(staffId) as { used: number };

    const totalLeaveDays = 18; // Default annual standard
    const usedDays = leaveRow?.used || 0;

    // 4. Document Completion
    const docs = this.db.prepare(`
      SELECT COUNT(*) as verified_count FROM staff_documents
      WHERE staff_id = ? AND verification_status = 'Verified'
    `).get(staffId) as { verified_count: number };

    const totalRequired = 5;
    const completedCount = docs?.verified_count || 0;
    const complianceScore = Math.min(100, Math.round((completedCount / totalRequired) * 100));

    // 5. Unread Notifications
    const unreadRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE is_read = 0 AND (recipient_user_id = ? OR recipient_staff_id = ?)
    `).get(userId, staffId) as { count: number };

    return {
      profile: staff || null,
      todayAttendance: todayAttendance || null,
      todayShift: todayShift || null,
      leaveBalance: {
        used: usedDays,
        total: totalLeaveDays,
        remaining: Math.max(0, totalLeaveDays - usedDays),
      },
      documentCompletion: {
        totalRequired,
        completedCount,
        complianceScore,
      },
      unreadNotificationsCount: unreadRow?.count || 0,
    };
  }

  // --- PROFILE CHANGE REQUESTS ---
  createProfileChangeRequest(input: {
    staff_id: number;
    field_name: string;
    old_value?: string;
    new_value: string;
    reason: string;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO staff_profile_change_requests (staff_id, field_name, old_value, new_value, reason, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `).run(input.staff_id, input.field_name, input.old_value || null, input.new_value.trim(), input.reason.trim());
    return Number(info.lastInsertRowid);
  }

  getProfileChangeRequests(staffId: number): ProfileChangeRequestRow[] {
    return this.db.prepare(`
      SELECT * FROM staff_profile_change_requests WHERE staff_id = ? ORDER BY id DESC
    `).all(staffId) as ProfileChangeRequestRow[];
  }

  updateAllowedProfileFields(staffId: number, fields: {
    email?: string;
    phone?: string;
    address_line_1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): void {
    const setClause: string[] = [];
    const params: any[] = [];

    if (fields.email !== undefined) { setClause.push('email = ?'); params.push(fields.email); }
    if (fields.phone !== undefined) { setClause.push('phone = ?'); params.push(fields.phone); }
    if (fields.address_line_1 !== undefined) { setClause.push('address_line_1 = ?'); params.push(fields.address_line_1); }
    if (fields.city !== undefined) { setClause.push('city = ?'); params.push(fields.city); }
    if (fields.state !== undefined) { setClause.push('state = ?'); params.push(fields.state); }
    if (fields.pincode !== undefined) { setClause.push('pincode = ?'); params.push(fields.pincode); }

    if (setClause.length === 0) return;

    setClause.push('updated_at = CURRENT_TIMESTAMP');
    params.push(staffId);

    this.db.prepare(`UPDATE staff SET ${setClause.join(', ')} WHERE id = ?`).run(...params);
  }

  // --- ATTENDANCE CORRECTION REQUESTS ---
  createAttendanceCorrectionRequest(input: {
    staff_id: number;
    attendance_id?: number;
    date: string;
    requested_check_in?: string;
    requested_check_out?: string;
    reason: string;
  }): number {
    const info = this.db.prepare(`
      INSERT INTO attendance_correction_requests (
        staff_id, attendance_id, date, requested_check_in, requested_check_out, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      input.staff_id, input.attendance_id || null, input.date,
      input.requested_check_in || null, input.requested_check_out || null, input.reason.trim()
    );
    return Number(info.lastInsertRowid);
  }

  getAttendanceCorrectionRequests(staffId: number): AttendanceCorrectionRequestRow[] {
    return this.db.prepare(`
      SELECT * FROM attendance_correction_requests WHERE staff_id = ? ORDER BY id DESC
    `).all(staffId) as AttendanceCorrectionRequestRow[];
  }
}
