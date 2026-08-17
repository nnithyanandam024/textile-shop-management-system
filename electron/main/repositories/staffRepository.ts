import Database from 'better-sqlite3';

export interface StaffRow {
  id: number;
  staff_code: string;
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  address?: string;
  joining_date: string;
  department_id: number;
  department_name?: string;
  department_code?: string;
  designation_id: number;
  designation_name?: string;
  designation_code?: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED';
  photo_path?: string;
  user_id?: number;
  username?: string;
  user_display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffQueryParams {
  search?: string;
  status?: string;
  department_id?: number;
  designation_id?: number;
  employment_type?: string;
  sortBy?: 'name' | 'joining_date' | 'staff_code' | 'department' | 'status';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export class StaffRepository {
  constructor(private db: Database.Database) {}

  generateStaffCode(): string {
    const row: any = this.db.prepare(`
      SELECT staff_code FROM staff ORDER BY id DESC LIMIT 1
    `).get();

    let nextNumber = 1;
    if (row && row.staff_code) {
      const match = row.staff_code.match(/STF-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    return `STF-${String(nextNumber).padStart(4, '0')}`;
  }

  getAll(params: StaffQueryParams = {}): { staff: StaffRow[]; total: number } {
    const conditions: string[] = [];
    const sqlParams: any[] = [];

    if (params.search && params.search.trim() !== '') {
      const term = `%${params.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(s.staff_code) LIKE ? OR
        LOWER(s.first_name) LIKE ? OR
        LOWER(COALESCE(s.last_name, '')) LIKE ? OR
        LOWER(s.first_name || ' ' || COALESCE(s.last_name, '')) LIKE ? OR
        LOWER(s.phone) LIKE ? OR
        LOWER(COALESCE(s.email, '')) LIKE ?
      )`);
      sqlParams.push(term, term, term, term, term, term);
    }

    if (params.status && params.status !== 'ALL') {
      conditions.push('s.status = ?');
      sqlParams.push(params.status);
    }

    if (params.department_id) {
      conditions.push('s.department_id = ?');
      sqlParams.push(params.department_id);
    }

    if (params.designation_id) {
      conditions.push('s.designation_id = ?');
      sqlParams.push(params.designation_id);
    }

    if (params.employment_type && params.employment_type !== 'ALL') {
      conditions.push('s.employment_type = ?');
      sqlParams.push(params.employment_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count Total
    const countRow: any = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM staff s
      ${whereClause}
    `).get(...sqlParams);
    const total = countRow?.total || 0;

    // Sorting
    let orderBy = 's.id DESC';
    const order = params.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    if (params.sortBy === 'name') {
      orderBy = `s.first_name ${order}, s.last_name ${order}`;
    } else if (params.sortBy === 'joining_date') {
      orderBy = `s.joining_date ${order}`;
    } else if (params.sortBy === 'staff_code') {
      orderBy = `s.staff_code ${order}`;
    } else if (params.sortBy === 'department') {
      orderBy = `dep.name ${order}`;
    } else if (params.sortBy === 'status') {
      orderBy = `s.status ${order}`;
    }

    // Pagination
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const offset = (page - 1) * limit;

    const staff = this.db.prepare(`
      SELECT s.*, 
             dep.name as department_name, dep.department_code,
             des.name as designation_name, des.designation_code,
             u.username, u.display_name as user_display_name
      FROM staff s
      JOIN departments dep ON s.department_id = dep.id
      JOIN designations des ON s.designation_id = des.id
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...sqlParams, limit, offset) as StaffRow[];

    return { staff, total };
  }

  getById(id: number): StaffRow | undefined {
    return this.db.prepare(`
      SELECT s.*, 
             dep.name as department_name, dep.department_code,
             des.name as designation_name, des.designation_code,
             u.username, u.display_name as user_display_name
      FROM staff s
      JOIN departments dep ON s.department_id = dep.id
      JOIN designations des ON s.designation_id = des.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(id) as StaffRow | undefined;
  }

  getByCode(code: string): StaffRow | undefined {
    return this.db.prepare('SELECT * FROM staff WHERE staff_code = ?').get(code) as StaffRow | undefined;
  }

  getByPhone(phone: string): StaffRow | undefined {
    return this.db.prepare('SELECT * FROM staff WHERE phone = ?').get(phone) as StaffRow | undefined;
  }

  getByUserId(userId: number): StaffRow | undefined {
    return this.db.prepare('SELECT * FROM staff WHERE user_id = ?').get(userId) as StaffRow | undefined;
  }

  create(s: {
    staff_code?: string;
    first_name: string;
    last_name?: string;
    phone: string;
    email?: string;
    address?: string;
    joining_date: string;
    department_id: number;
    designation_id: number;
    employment_type?: string;
    status?: string;
    photo_path?: string;
    user_id?: number;
  }): number {
    const code = s.staff_code || this.generateStaffCode();
    const info = this.db.prepare(`
      INSERT INTO staff (
        staff_code, first_name, last_name, phone, email, address,
        joining_date, department_id, designation_id, employment_type,
        status, photo_path, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code,
      s.first_name.trim(),
      s.last_name?.trim() || null,
      s.phone.trim(),
      s.email?.trim() || null,
      s.address?.trim() || null,
      s.joining_date,
      s.department_id,
      s.designation_id,
      s.employment_type || 'FULL_TIME',
      s.status || 'ACTIVE',
      s.photo_path || null,
      s.user_id || null
    );
    return Number(info.lastInsertRowid);
  }

  update(id: number, s: Partial<StaffRow>): void {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedKeys: (keyof StaffRow)[] = [
      'first_name', 'last_name', 'phone', 'email', 'address',
      'joining_date', 'department_id', 'designation_id',
      'employment_type', 'status', 'photo_path', 'user_id'
    ];

    for (const key of allowedKeys) {
      if (s[key] !== undefined) {
        fields.push(`${key} = ?`);
        const val = s[key];
        values.push(typeof val === 'string' ? val.trim() : val);
      }
    }

    if (fields.length === 0) return;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`UPDATE staff SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  updateStatus(id: number, status: string): void {
    this.db.prepare('UPDATE staff SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  }
}
