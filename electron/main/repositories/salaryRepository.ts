import Database from 'better-sqlite3';

export interface SalaryStructureRow {
  id: number;
  staff_id: number;
  staff_code?: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  effective_from: string;
  effective_to?: string;
  pay_frequency: string;
  basic_salary: number;
  gross_salary: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_by?: number;
  created_at: string;
  updated_at: string;
  components?: SalaryStructureComponentRow[];
}

export interface SalaryComponentRow {
  id: number;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  calculation_method: string;
  default_value: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface SalaryStructureComponentRow {
  id: number;
  salary_structure_id: number;
  component_id: number;
  component_code?: string;
  component_name?: string;
  type?: 'EARNING' | 'DEDUCTION';
  calculation_method: string;
  value: number;
  calculated_amount?: number;
  created_at: string;
}

export class SalaryRepository {
  constructor(private db: Database.Database) {}

  // --- SALARY COMPONENTS ---
  getAllComponents(): SalaryComponentRow[] {
    return this.db.prepare("SELECT * FROM salary_components WHERE status = 'ACTIVE' ORDER BY id ASC").all() as SalaryComponentRow[];
  }

  getComponentByCode(code: string): SalaryComponentRow | undefined {
    return this.db.prepare('SELECT * FROM salary_components WHERE code = ?').get(code.trim().toUpperCase()) as SalaryComponentRow | undefined;
  }

  // --- SALARY STRUCTURES ---
  getCurrentStructure(staffId: number, dateStr?: string): SalaryStructureRow | undefined {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const row = this.db.prepare(`
      SELECT ss.*, s.staff_code, s.first_name, s.last_name, d.name as department_name
      FROM salary_structures ss
      JOIN staff s ON ss.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE ss.staff_id = ?
        AND ss.effective_from <= ?
        AND (ss.effective_to IS NULL OR ss.effective_to >= ?)
        AND ss.status = 'ACTIVE'
      ORDER BY ss.effective_from DESC, ss.id DESC
      LIMIT 1
    `).get(staffId, targetDate, targetDate) as SalaryStructureRow | undefined;

    if (row) {
      row.components = this.getStructureComponents(row.id);
    }
    return row;
  }

  getSalaryHistory(staffId: number): SalaryStructureRow[] {
    const rows = this.db.prepare(`
      SELECT ss.*, s.staff_code, s.first_name, s.last_name, d.name as department_name
      FROM salary_structures ss
      JOIN staff s ON ss.staff_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE ss.staff_id = ?
      ORDER BY ss.effective_from DESC, ss.id DESC
    `).all(staffId) as SalaryStructureRow[];

    for (const r of rows) {
      r.components = this.getStructureComponents(r.id);
    }
    return rows;
  }

  getStructureComponents(structureId: number): SalaryStructureComponentRow[] {
    return this.db.prepare(`
      SELECT ssc.*, sc.code as component_code, sc.name as component_name, sc.type
      FROM salary_structure_components ssc
      JOIN salary_components sc ON ssc.component_id = sc.id
      WHERE ssc.salary_structure_id = ?
      ORDER BY sc.id ASC
    `).all(structureId) as SalaryStructureComponentRow[];
  }

  createStructure(input: {
    staff_id: number;
    effective_from: string;
    pay_frequency?: string;
    basic_salary: number;
    gross_salary: number;
    created_by?: number;
    components: Array<{
      component_id: number;
      calculation_method: string;
      value: number;
    }>;
  }): number {
    const activeTx = this.db.transaction(() => {
      // Deactivate/close previous active structure's effective_to if present
      const current = this.getCurrentStructure(input.staff_id, input.effective_from);
      if (current) {
        const prevDay = new Date(input.effective_from);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = prevDay.toISOString().split('T')[0];
        this.db.prepare('UPDATE salary_structures SET effective_to = ? WHERE id = ?').run(prevDayStr, current.id);
      }

      const info = this.db.prepare(`
        INSERT INTO salary_structures (
          staff_id, effective_from, pay_frequency, basic_salary, gross_salary, status, created_by
        ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
      `).run(
        input.staff_id,
        input.effective_from,
        input.pay_frequency || 'MONTHLY',
        input.basic_salary,
        input.gross_salary,
        input.created_by || null
      );
      const structureId = Number(info.lastInsertRowid);

      const stmt = this.db.prepare(`
        INSERT INTO salary_structure_components (salary_structure_id, component_id, calculation_method, value)
        VALUES (?, ?, ?, ?)
      `);

      for (const comp of input.components) {
        stmt.run(structureId, comp.component_id, comp.calculation_method || 'FIXED', comp.value || 0);
      }

      return structureId;
    });

    return activeTx();
  }
}
