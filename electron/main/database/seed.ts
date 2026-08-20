import Database from 'better-sqlite3';
import { PasswordService } from '../services/auth/passwordService';
import log from '../logger';

export function seedDatabase(db: Database.Database) {
  log.info('Running comprehensive database seed script...');

  const transaction = db.transaction(() => {
    // Hash default test password 'password123'
    const defaultPasswordHash = PasswordService.hashPasswordSync('password123');

    // ----------------------------------------------------
    // 1. ROLES & PERMISSIONS
    // ----------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO roles (id, name, description) VALUES
        (1, 'Owner', 'Full system access and store administrative privileges'),
        (2, 'Manager', 'Access to sales, inventory, purchases, and reporting'),
        (3, 'Cashier', 'Access to POS billing terminal, customer registry, and staff portal'),
        (4, 'Inventory Staff', 'Access to stock movements and product management'),
        (6, 'HR Staff', 'Access to staff records, payroll, and compliance');
    `);

    // ----------------------------------------------------
    // 2. USERS (LOGIN ACCOUNTS)
    // ----------------------------------------------------
    const users = [
      { id: 1, username: 'admin', display_name: 'Store Administrator', role_id: 1, is_active: 1 },
      { id: 2, username: 'manager', display_name: 'Rajesh Kumar (Manager)', role_id: 2, is_active: 1 },
      { id: 3, username: 'arun.cashier', display_name: 'Arun Kumar', role_id: 3, is_active: 1 },
      { id: 4, username: 'priya.sales', display_name: 'Priya Sharma', role_id: 3, is_active: 1 },
      { id: 5, username: 'karthik.inventory', display_name: 'Karthik Raja', role_id: 4, is_active: 1 },
      { id: 6, username: 'anitha.hr', display_name: 'Anitha Ramesh', role_id: 6, is_active: 1 },
      { id: 7, username: 'inactive.staff', display_name: 'Inactive Staff User', role_id: 3, is_active: 0 },
      { id: 8, username: 'suspended.staff', display_name: 'Suspended Staff User', role_id: 3, is_active: 1 },
    ];

    for (const u of users) {
      db.prepare(`
        INSERT INTO users (id, username, password_hash, display_name, role_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          username = excluded.username,
          password_hash = excluded.password_hash,
          display_name = excluded.display_name,
          role_id = excluded.role_id,
          is_active = excluded.is_active
      `).run(u.id, u.username, defaultPasswordHash, u.display_name, u.role_id, u.is_active);
    }

    // ----------------------------------------------------
    // 3. DEPARTMENTS & DESIGNATIONS
    // ----------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO departments (id, department_code, name, description, status) VALUES
        (1, 'DEP-001', 'Storefront Sales', 'Customer assistance and counter sales operations', 'ACTIVE'),
        (2, 'DEP-002', 'Inventory & Stock', 'Warehouse management, stocking and alterations', 'ACTIVE'),
        (3, 'DEP-003', 'Accounts & Billing', 'Cash desk, receipts, and book-keeping', 'ACTIVE'),
        (4, 'DEP-004', 'Store Management', 'Overall retail floor and branch supervision', 'ACTIVE'),
        (5, 'DEP-005', 'HR & Administration', 'Staff welfare, payroll, and compliance', 'ACTIVE');

      INSERT OR IGNORE INTO designations (id, designation_code, name, department_id, description, status) VALUES
        (1, 'DES-001', 'Senior Sales Associate', 1, 'Senior customer service and retail consultant', 'ACTIVE'),
        (2, 'DES-002', 'Sales Executive', 1, 'Floor customer executive', 'ACTIVE'),
        (3, 'DES-003', 'Stock Specialist', 2, 'Inventory ledger and stock handler', 'ACTIVE'),
        (4, 'DES-004', 'Head Cashier', 3, 'Billing supervisor', 'ACTIVE'),
        (5, 'DES-005', 'Store Manager', 4, 'Overall shop operations lead', 'ACTIVE'),
        (6, 'DES-006', 'HR Specialist', 5, 'People operations and compliance', 'ACTIVE');
    `);

    // ----------------------------------------------------
    // 4. STAFF PROFILES
    // ----------------------------------------------------
    const staffMembers = [
      {
        id: 1,
        code: 'STF-0001',
        first_name: 'Rajesh',
        last_name: 'Kumar',
        phone: '+91 98765 11001',
        email: 'rajesh.manager@texora.shop',
        dep_id: 4,
        des_id: 5,
        location: 'Main Textile Store',
        user_id: 2,
        status: 'ACTIVE',
      },
      {
        id: 2,
        code: 'STF-0002',
        first_name: 'Arun',
        last_name: 'Kumar',
        phone: '+91 98765 22002',
        email: 'arun.cashier@texora.shop',
        dep_id: 1,
        des_id: 1,
        location: 'Main Textile Store',
        user_id: 3,
        status: 'ACTIVE',
      },
      {
        id: 3,
        code: 'STF-0003',
        first_name: 'Priya',
        last_name: 'Sharma',
        phone: '+91 98765 33003',
        email: 'priya.sales@texora.shop',
        dep_id: 1,
        des_id: 2,
        location: 'Main Textile Store',
        user_id: 4,
        status: 'ACTIVE',
      },
      {
        id: 4,
        code: 'STF-0004',
        first_name: 'Karthik',
        last_name: 'Raja',
        phone: '+91 98765 44004',
        email: 'karthik.stock@texora.shop',
        dep_id: 2,
        des_id: 3,
        location: 'Warehouse Hub',
        user_id: 5,
        status: 'ACTIVE',
      },
      {
        id: 5,
        code: 'STF-0005',
        first_name: 'Anitha',
        last_name: 'Ramesh',
        phone: '+91 98765 55005',
        email: 'anitha.hr@texora.shop',
        dep_id: 5,
        des_id: 6,
        location: 'Main Textile Store',
        user_id: 6,
        status: 'ACTIVE',
      },
      {
        id: 6,
        code: 'STF-0006',
        first_name: 'Inactive',
        last_name: 'Employee',
        phone: '+91 98765 66006',
        email: 'inactive@texora.shop',
        dep_id: 1,
        des_id: 2,
        location: 'Main Textile Store',
        user_id: 7,
        status: 'INACTIVE',
      },
      {
        id: 7,
        code: 'STF-0007',
        first_name: 'Suspended',
        last_name: 'Employee',
        phone: '+91 98765 77007',
        email: 'suspended@texora.shop',
        dep_id: 1,
        des_id: 2,
        location: 'Main Textile Store',
        user_id: 8,
        status: 'SUSPENDED',
      },
    ];

    for (const s of staffMembers) {
      db.prepare(`
        INSERT INTO staff (
          id, staff_code, first_name, last_name, phone, email,
          department_id, designation_id, work_location, joining_date,
          employment_type, status, user_id, address_line_1, city, state, pincode
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, '2026-01-01',
          'FULL_TIME', ?, ?, '123 Bazaar Main St', 'Coimbatore', 'Tamil Nadu', '641001'
        )
        ON CONFLICT(id) DO UPDATE SET
          staff_code = excluded.staff_code,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          phone = excluded.phone,
          email = excluded.email,
          department_id = excluded.department_id,
          designation_id = excluded.designation_id,
          work_location = excluded.work_location,
          status = excluded.status,
          user_id = excluded.user_id
      `).run(s.id, s.code, s.first_name, s.last_name, s.phone, s.email, s.dep_id, s.des_id, s.location, s.status, s.user_id);
    }

    // ----------------------------------------------------
    // 5. SHIFT TEMPLATES & ASSIGNMENTS
    // ----------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO shift_templates (id, shift_code, name, start_time, end_time, break_minutes, minimum_work_minutes) VALUES
        (1, 'MS-01', 'Morning Shift', '09:00', '18:00', 60, 480),
        (2, 'ES-01', 'Evening Shift', '13:00', '22:00', 60, 480),
        (3, 'GS-01', 'General Shift', '10:00', '19:00', 60, 480);
    `);

    for (let sid = 1; sid <= 5; sid++) {
      db.prepare(`
        INSERT OR IGNORE INTO staff_shift_assignments (staff_id, shift_template_id, effective_from, effective_to)
        VALUES (?, 1, '2026-01-01', '2026-12-31')
      `).run(sid);
    }

    // ----------------------------------------------------
    // 6. ATTENDANCE (TODAY & RECENT)
    // ----------------------------------------------------
    const todayStr = new Date().toISOString().slice(0, 10);
    // Arun Kumar (Staff #2) - Today Checked In Present
    db.prepare(`
      INSERT INTO attendance (staff_id, attendance_date, check_in, status, worked_minutes)
      VALUES (2, ?, '09:02', 'PRESENT', 324)
      ON CONFLICT(staff_id, attendance_date) DO UPDATE SET
        check_in = excluded.check_in,
        status = excluded.status,
        worked_minutes = excluded.worked_minutes
    `).run(todayStr);

    // Rajesh Kumar (Staff #1) - Today Completed Shift
    db.prepare(`
      INSERT INTO attendance (staff_id, attendance_date, check_in, check_out, status, worked_minutes)
      VALUES (1, ?, '08:55', '18:05', 'COMPLETED', 490)
      ON CONFLICT(staff_id, attendance_date) DO UPDATE SET
        check_in = excluded.check_in,
        check_out = excluded.check_out,
        status = excluded.status,
        worked_minutes = excluded.worked_minutes
    `).run(todayStr);

    // ----------------------------------------------------
    // 7. LEAVE TYPES & BALANCES
    // ----------------------------------------------------
    const cl = db.prepare(`SELECT id FROM leave_types WHERE leave_code = 'CL'`).get() as any;
    const al = db.prepare(`SELECT id FROM leave_types WHERE leave_code = 'AL'`).get() as any;
    const clId = cl?.id || 1;
    const alId = al?.id || 2;

    for (let sid = 1; sid <= 5; sid++) {
      db.prepare(`
        INSERT INTO leave_balances (staff_id, leave_type_id, year, allocated_days, used_days)
        VALUES (?, ?, 2026, 6, 2)
        ON CONFLICT(staff_id, leave_type_id, year) DO UPDATE SET
          allocated_days = excluded.allocated_days,
          used_days = excluded.used_days
      `).run(sid, clId);

      db.prepare(`
        INSERT INTO leave_balances (staff_id, leave_type_id, year, allocated_days, used_days)
        VALUES (?, ?, 2026, 12, 4)
        ON CONFLICT(staff_id, leave_type_id, year) DO UPDATE SET
          allocated_days = excluded.allocated_days,
          used_days = excluded.used_days
      `).run(sid, alId);
    }

    // ----------------------------------------------------
    // 8. ONBOARDING DOCUMENTS
    // ----------------------------------------------------
    const catRow = db.prepare(`SELECT id FROM document_categories LIMIT 1`).get() as any;
    const catId = catRow?.id || 1;

    const sampleDocs = [
      { name: 'Aadhar Card', file: 'aadhar_card.pdf', type: 'GOVT_ID', verified: 'Verified', exp: '2030-12-31' },
      { name: 'PAN Card', file: 'pan_card.pdf', type: 'TAX_ID', verified: 'Verified', exp: null },
      { name: 'Bank Passbook', file: 'bank_passbook.pdf', type: 'BANK_PROOF', verified: 'Verified', exp: null },
      { name: 'Employment Contract', file: 'contract_signed.pdf', type: 'CONTRACT', verified: 'Verified', exp: '2027-12-31' },
      { name: 'Safety & Retail Certificate', file: 'safety_training.pdf', type: 'CERTIFICATE', verified: 'Verified', exp: '2026-08-28' }, // Expiring in ~7 days
    ];

    for (const doc of sampleDocs) {
      db.prepare(`
        INSERT OR IGNORE INTO staff_documents (
          staff_id, category_id, document_type, file_name, file_path, file_size, mime_type, verification_status, expiry_date
        ) VALUES (
          2, ?, ?, ?, '/documents/' || ?, 10240, 'application/pdf', ?, ?
        )
      `).run(catId, doc.type, doc.file, doc.file, doc.verified, doc.exp);
    }

    // ----------------------------------------------------
    // 9. TEXTILE CATEGORIES, BRANDS & PRODUCTS
    // ----------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO categories (id, name, description, parent_id) VALUES
        (1, 'Men''s Wear', 'Clothing and fabrics for men', NULL),
        (2, 'Women''s Wear', 'Sarees, kurtis, dresses and traditional wear', NULL),
        (3, 'Kids Wear', 'Children and infant apparel', NULL),
        (4, 'Fabrics & Silks', 'Pure silks, cotton shirting, and suiting pieces', NULL),
        (5, 'Men Formal Shirts', 'Premium cotton and linen shirts', 1),
        (6, 'Silk Sarees', 'Kanchipuram, Banarasi and soft silk sarees', 2),
        (7, 'Cotton Kurtis', 'Daily wear embroidered kurtis', 2),
        (8, 'Silk Dhotis', 'Traditional wedding and festival dhotis', 1);

      INSERT OR IGNORE INTO brands (id, name, description) VALUES
        (1, 'Raymond', 'Premium fine suiting and shirting brand'),
        (2, 'Kanchipuram Silks', 'Handloom pure mulberry silk sarees'),
        (3, 'Peter England', 'Formal business apparel'),
        (4, 'FabIndia', 'Organic traditional ethnic collection'),
        (5, 'Ramraj', 'Traditional cotton and silk dhotis');
    `);

    // Products & Variants
    const products = [
      { id: 1, name: 'Premium Cotton Shirt', cat_id: 5, brand_id: 1, mat: 'Cotton' },
      { id: 2, name: 'Silk Saree Traditional', cat_id: 6, brand_id: 2, mat: 'Silk' },
      { id: 3, name: 'FabIndia Embroidered Kurti', cat_id: 7, brand_id: 4, mat: 'Organic Cotton' },
      { id: 4, name: 'Ramraj Pattu Dhoti with Angavastram', cat_id: 8, brand_id: 5, mat: 'Silk & Zari' },
    ];

    for (const p of products) {
      db.prepare(`
        INSERT INTO products (id, name, category_id, brand_id, material, description)
        VALUES (?, ?, ?, ?, ?, 'High quality textile product')
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          category_id = excluded.category_id,
          brand_id = excluded.brand_id,
          material = excluded.material
      `).run(p.id, p.name, p.cat_id, p.brand_id, p.mat);
    }

    // Variants
    const variants = [
      { id: 1, pid: 1, sku: 'TX-PCS-001', barcode: '89010001001', size: 'M', color: 'Blue', buy: 600.0, sell: 999.0, stock: 15 },
      { id: 2, pid: 1, sku: 'TX-PCS-002', barcode: '89010001002', size: 'L', color: 'Blue', buy: 600.0, sell: 999.0, stock: 12 },
      { id: 3, pid: 2, sku: 'TX-SLK-001', barcode: '89010002001', size: 'Free Size', color: 'Gold', buy: 2500.0, sell: 4500.0, stock: 8 },
      { id: 4, pid: 2, sku: 'KAN-SAR-GRN-02', barcode: '89010002002', size: 'Free Size', color: 'Emerald Green', buy: 4200.0, sell: 8499.0, stock: 8 },
      { id: 5, pid: 3, sku: 'FAB-KUR-YLW-M', barcode: '89010003001', size: 'M', color: 'Mustard Yellow', buy: 400.0, sell: 899.0, stock: 25 },
      { id: 6, pid: 4, sku: 'RAM-DHO-GLD-01', barcode: '89010004001', size: 'Free Size', color: 'Cream / Gold Zari', buy: 850.0, sell: 1599.0, stock: 15 },
    ];

    for (const v of variants) {
      db.prepare(`
        INSERT INTO product_variants (id, product_id, sku, barcode, size, color, purchase_price, selling_price, minimum_stock, current_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5, ?)
        ON CONFLICT(id) DO UPDATE SET
          sku = excluded.sku,
          barcode = excluded.barcode,
          size = excluded.size,
          color = excluded.color,
          purchase_price = excluded.purchase_price,
          selling_price = excluded.selling_price,
          current_stock = excluded.current_stock
      `).run(v.id, v.pid, v.sku, v.barcode, v.size, v.color, v.buy, v.sell, v.stock);
    }

    // ----------------------------------------------------
    // 10. CUSTOMERS & SUPPLIERS
    // ----------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO customers (id, customer_code, name, phone, address) VALUES
        (1, 'CUST-0000', 'Walk-in Customer', '0000000000', 'Counter Sale'),
        (2, 'CUST-0001', 'Sundaram Textiles Customer', '+91 94433 11223', 'Crosscut Road, Coimbatore'),
        (3, 'CUST-0002', 'Meenakshi Sundaram', '+91 98422 55667', 'Gandhipuram, Coimbatore');

      INSERT OR IGNORE INTO suppliers (id, supplier_code, company_name, contact_person, phone) VALUES
        (1, 'SUPP-0001', 'Textile Wholesale Hub', 'Rajesh Kumar', '+91 98765 00001'),
        (2, 'SUPP-0002', 'Kanchipuram Silk Weavers Society', 'Venkatesh S', '+91 98401 22334'),
        (3, 'SUPP-0003', 'Surat Fabrics Wholesalers', 'Dinesh Patel', '+91 98250 88990');
    `);

    // ----------------------------------------------------
    // 11. DEFAULT STORE SETTINGS
    // ----------------------------------------------------
    db.exec(`
      INSERT INTO settings (key, value) VALUES
        ('shop_name', 'Texora Fashion Store'),
        ('shop_address', '123 Crosscut Road, Gandhipuram, Coimbatore, Tamil Nadu - 641012'),
        ('shop_phone', '+91 98765 43210'),
        ('gst_number', '33AAAAA0000A1Z5'),
        ('currency', 'INR'),
        ('invoice_prefix', 'INV-'),
        ('default_tax_rate', '5.0'),
        ('low_stock_threshold', '5')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `);

    // ----------------------------------------------------
    // 12. AUDIT LOG INITIAL EVENTS
    // ----------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value) VALUES
        (1, 3, 'STAFF_LOGIN_SUCCESS', 'STAFF', 2, 'Attendance recorded for Morning Shift'),
        (2, 2, 'SHIFT_ASSIGNMENT', 'STAFF', 2, 'Shift assigned: Morning Shift (09:00 - 18:00)'),
        (3, 6, 'LEAVE_APPROVED', 'STAFF', 2, 'Casual Leave request approved for 2 days'),
        (4, 6, 'DOCUMENT_VERIFIED', 'STAFF', 2, 'Address proof verified and compliant');
    `);
  });

  transaction();
  log.info('Comprehensive database seed completed successfully.');
}
