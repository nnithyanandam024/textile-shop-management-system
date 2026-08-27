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
      { id: 2, username: 'manager', display_name: 'Rajesh Kumar (Manager)', role_id: 2, email: 'rajesh.manager@ratnavilas.com', phone: '+91 98765 43211', is_active: 1 },
      { id: 3, username: 'arun.cashier', display_name: 'Arun Kumar', role_id: 3, email: 'arun.cashier@ratnavilas.com', phone: '+91 98765 43212', is_active: 1 },
      { id: 4, username: 'priya.sales', display_name: 'Priya Sundaram', role_id: 3, email: 'priya.sales@ratnavilas.com', phone: '+91 98765 43213', is_active: 1 },
      { id: 5, username: 'karthik.stock', display_name: 'Karthik Raja', role_id: 4, email: 'karthik.stock@ratnavilas.com', phone: '+91 98765 43214', is_active: 1 },
      { id: 6, username: 'anitha.hr', display_name: 'Anitha Ramesh', role_id: 6, email: 'anitha.hr@ratnavilas.com', phone: '+91 98765 43215', is_active: 1 },
      { id: 7, username: 'inactive_staff', display_name: 'Inactive User', role_id: 3, email: 'inactive@ratnavilas.com', phone: '+91 98765 43216', is_active: 0 },
      { id: 8, username: 'suspended_staff', display_name: 'Suspended User', role_id: 3, email: 'suspended@ratnavilas.com', phone: '+91 98765 43217', is_active: 1 },
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
        email: 'rajesh.manager@ratnavilas.com',
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
        email: 'arun.cashier@ratnavilas.com',
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
        email: 'priya.sales@ratnavilas.com',
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
        email: 'karthik.stock@ratnavilas.com',
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
        email: 'anitha.hr@ratnavilas.com',
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
        email: 'inactive@ratnavilas.com',
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
        email: 'suspended@ratnavilas.com',
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
        (4, 'Silks & Traditional', 'Pure silks, cotton shirting, and suiting pieces', NULL),
        (5, 'Fabrics & Suiting', 'Unstitched suit lengths, fine linen, and shirting material', NULL),
        (6, 'Daily Cotton Kurtis', 'Breathable block-printed pure cotton kurtis', 2),
        (7, 'Silk Sarees', 'Pure mulberry silk with heavy gold and silver zari', 4),
        (8, 'Men Formal Shirts', 'Premium cotton and linen wrinkle-free shirts', 1),
        (9, 'Silk Dhotis & Sets', 'Traditional wedding dhotis with angavastram', 1),
        (10, 'Designer Salwar & Suits', 'Embroidered festive and casual salwar kameez sets', 2),
        (11, 'Kids Ethnic & Pattu Pavadai', 'Traditional silk skirts and kurta sets for children', 3),
        (12, 'Home Linen & Furnishings', 'Fine cotton bedsheets, silk shawls and drapery', 5);

      INSERT OR IGNORE INTO brands (id, name, description) VALUES
        (1, 'Raymond', 'Fine luxury fabrics, suiting, and formal shirting'),
        (2, 'Kanchipuram Silks', 'Handcrafted heritage mulberry silk sarees'),
        (3, 'FabIndia', 'Authentic Indian ethnic handloom and organic cotton'),
        (4, 'Ramraj Cotton', 'Pioneer in South Indian traditional dhotis and shirts'),
        (5, 'Peter England', 'Modern business formals and smart casuals'),
        (6, 'Manyavar', 'Celebration ethnic wear, kurtas, and sherwanis'),
        (7, 'Pothys Silks', 'Traditional textile house for silk weaves'),
        (8, 'Linen Club', 'Premium 100% pure European linen apparel and fabrics'),
        (9, 'Biba', 'Contemporary ethnic wear and designer salwar suits'),
        (10, 'Bombay Dyeing', 'Heritage home textiles and high-count cotton bedding');
    `);

    // Products
    const products = [
      { id: 1, name: 'Kanchipuram Pure Zari Silk Saree', cat_id: 7, brand_id: 2, mat: 'Pure Mulberry Silk' },
      { id: 2, name: 'Raymond 100% Egyptian Cotton Formal Shirt', cat_id: 8, brand_id: 1, mat: 'Giza Egyptian Cotton' },
      { id: 3, name: 'FabIndia Hand-Block Printed Cotton Kurti', cat_id: 6, brand_id: 3, mat: 'Organic Cotton' },
      { id: 4, name: 'Ramraj Pure Silk Dhoti & Angavastram Set', cat_id: 9, brand_id: 4, mat: 'Pure Silk & Zari' },
      { id: 5, name: 'Peter England Classic Business Formal Shirt', cat_id: 8, brand_id: 5, mat: 'Cotton Blend' },
      { id: 6, name: 'Manyavar Jacquard Silk Kurta & Churidar Set', cat_id: 1, brand_id: 6, mat: 'Art Silk Jacquard' },
      { id: 7, name: 'Banarasi Brocade Silk Saree', cat_id: 7, brand_id: 7, mat: 'Banarasi Silk' },
      { id: 8, name: 'Linen Club Pure Linen Casual Shirt', cat_id: 1, brand_id: 8, mat: '100% Pure Flax Linen' },
      { id: 9, name: 'Biba Festive Anarkali Embroidered Suit', cat_id: 10, brand_id: 9, mat: 'Chanderi Silk & Georgette' },
      { id: 10, name: 'Pattu Pavadai Girls Traditional Silk Set', cat_id: 11, brand_id: 7, mat: 'Soft Silk & Zari' },
      { id: 11, name: 'Coimbatore Handloom Soft Silk Saree', cat_id: 7, brand_id: 2, mat: 'Soft Handloom Silk' },
      { id: 12, name: 'Bombay Dyeing 100% Cotton King Bedsheet Set', cat_id: 12, brand_id: 10, mat: '300 TC Percale Cotton' },
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

    // Variants with Normal, Low Stock, and Out of Stock
    const variants = [
      // Product 1 - Kanchipuram Silk Saree
      { id: 1, pid: 1, sku: 'KAN-SLK-MRN-01', barcode: '89010001001', size: 'Free Size', color: 'Royal Maroon & Gold', buy: 4500, sell: 8499, min: 5, stock: 14 },
      { id: 2, pid: 1, sku: 'KAN-SLK-GRN-02', barcode: '89010001002', size: 'Free Size', color: 'Emerald Green & Gold', buy: 4500, sell: 8499, min: 5, stock: 7 },
      { id: 3, pid: 1, sku: 'KAN-SLK-NVY-03', barcode: '89010001003', size: 'Free Size', color: 'Royal Navy Blue', buy: 4800, sell: 8999, min: 4, stock: 3 },
      { id: 4, pid: 1, sku: 'KAN-SLK-RED-04', barcode: '89010001004', size: 'Free Size', color: 'Temple Crimson Red', buy: 5200, sell: 9499, min: 4, stock: 0 },

      // Product 2 - Raymond Cotton Shirt
      { id: 5, pid: 2, sku: 'RAY-SHT-BLU-38', barcode: '89010002038', size: '38 (S)', color: 'Sky Blue', buy: 750, sell: 1499, min: 8, stock: 18 },
      { id: 6, pid: 2, sku: 'RAY-SHT-BLU-40', barcode: '89010002040', size: '40 (M)', color: 'Sky Blue', buy: 750, sell: 1499, min: 10, stock: 24 },
      { id: 7, pid: 2, sku: 'RAY-SHT-BLU-42', barcode: '89010002042', size: '42 (L)', color: 'Sky Blue', buy: 750, sell: 1499, min: 8, stock: 4 },
      { id: 8, pid: 2, sku: 'RAY-SHT-WHT-40', barcode: '89010002140', size: '40 (M)', color: 'Pure White', buy: 750, sell: 1499, min: 10, stock: 32 },
      { id: 9, pid: 2, sku: 'RAY-SHT-CHR-40', barcode: '89010002240', size: '40 (M)', color: 'Charcoal Gray', buy: 750, sell: 1499, min: 6, stock: 0 },

      // Product 3 - FabIndia Kurti
      { id: 10, pid: 3, sku: 'FAB-KUR-IND-S', barcode: '89010003001', size: 'S', color: 'Indigo Blue', buy: 550, sell: 1299, min: 5, stock: 12 },
      { id: 11, pid: 3, sku: 'FAB-KUR-IND-M', barcode: '89010003002', size: 'M', color: 'Indigo Blue', buy: 550, sell: 1299, min: 8, stock: 20 },
      { id: 12, pid: 3, sku: 'FAB-KUR-IND-L', barcode: '89010003003', size: 'L', color: 'Indigo Blue', buy: 550, sell: 1299, min: 6, stock: 2 },
      { id: 13, pid: 3, sku: 'FAB-KUR-MST-M', barcode: '89010003102', size: 'M', color: 'Mustard Yellow', buy: 550, sell: 1299, min: 6, stock: 15 },
      { id: 14, pid: 3, sku: 'FAB-KUR-OLV-M', barcode: '89010003202', size: 'M', color: 'Olive Green', buy: 550, sell: 1299, min: 5, stock: 0 },

      // Product 4 - Ramraj Silk Dhoti
      { id: 15, pid: 4, sku: 'RAM-DHO-GLD-01', barcode: '89010004001', size: '4.0 Meters', color: 'Cream / Gold Zari', buy: 950, sell: 1899, min: 10, stock: 28 },
      { id: 16, pid: 4, sku: 'RAM-DHO-SLV-02', barcode: '89010004002', size: '4.0 Meters', color: 'White / Silver Border', buy: 850, sell: 1699, min: 8, stock: 4 },

      // Product 5 - Peter England Shirt
      { id: 17, pid: 5, sku: 'PET-SHT-WHT-40', barcode: '89010005040', size: '40 (M)', color: 'Crisp White', buy: 580, sell: 1199, min: 10, stock: 35 },
      { id: 18, pid: 5, sku: 'PET-SHT-NVY-40', barcode: '89010005140', size: '40 (M)', color: 'Navy Blue', buy: 580, sell: 1199, min: 8, stock: 18 },
      { id: 19, pid: 5, sku: 'PET-SHT-OXF-42', barcode: '89010005242', size: '42 (L)', color: 'Oxford Gray', buy: 580, sell: 1199, min: 6, stock: 0 },

      // Product 6 - Manyavar Kurta Set
      { id: 20, pid: 6, sku: 'MAN-KUR-MRN-L', barcode: '89010006001', size: 'L (42)', color: 'Deep Maroon', buy: 1700, sell: 3499, min: 4, stock: 8 },
      { id: 21, pid: 6, sku: 'MAN-KUR-IVR-M', barcode: '89010006002', size: 'M (40)', color: 'Ivory Gold', buy: 1800, sell: 3699, min: 4, stock: 3 },
      { id: 22, pid: 6, sku: 'MAN-KUR-ROY-XL', barcode: '89010006003', size: 'XL (44)', color: 'Royal Blue', buy: 1700, sell: 3499, min: 3, stock: 0 },

      // Product 7 - Banarasi Silk Saree
      { id: 23, pid: 7, sku: 'BAN-SLK-RED-01', barcode: '89010007001', size: 'Free Size', color: 'Crimson Red & Zari', buy: 3800, sell: 6999, min: 5, stock: 9 },
      { id: 24, pid: 7, sku: 'BAN-SLK-PNK-02', barcode: '89010007002', size: 'Free Size', color: 'Rani Pink & Gold', buy: 3800, sell: 6999, min: 4, stock: 2 },

      // Product 8 - Linen Club Shirt
      { id: 25, pid: 8, sku: 'LIN-SHT-BGE-40', barcode: '89010008040', size: '40 (M)', color: 'Natural Beige', buy: 1100, sell: 2299, min: 6, stock: 16 },
      { id: 26, pid: 8, sku: 'LIN-SHT-OLV-42', barcode: '89010008042', size: '42 (L)', color: 'Olive Green', buy: 1100, sell: 2299, min: 5, stock: 11 },
      { id: 27, pid: 8, sku: 'LIN-SHT-SKY-40', barcode: '89010008140', size: '40 (M)', color: 'Sky Blue', buy: 1100, sell: 2299, min: 6, stock: 1 },

      // Product 9 - Biba Anarkali Suit
      { id: 28, pid: 9, sku: 'BIB-SLW-TEL-M', barcode: '89010009001', size: 'M (38)', color: 'Teal Blue & Gold', buy: 1600, sell: 3299, min: 5, stock: 14 },
      { id: 29, pid: 9, sku: 'BIB-SLW-PCH-L', barcode: '89010009002', size: 'L (40)', color: 'Peach Blossom', buy: 1600, sell: 3299, min: 5, stock: 3 },
      { id: 30, pid: 9, sku: 'BIB-SLW-MRN-S', barcode: '89010009003', size: 'S (36)', color: 'Wine Maroon', buy: 1600, sell: 3299, min: 4, stock: 0 },

      // Product 10 - Pattu Pavadai Kids Set
      { id: 31, pid: 10, sku: 'PAT-KID-MAG-28', barcode: '89010010028', size: 'Size 28 (Age 6-8)', color: 'Magenta & Gold', buy: 950, sell: 1999, min: 6, stock: 15 },
      { id: 32, pid: 10, sku: 'PAT-KID-GRN-32', barcode: '89010010032', size: 'Size 32 (Age 9-11)', color: 'Emerald Peacock', buy: 1050, sell: 2199, min: 4, stock: 2 },

      // Product 11 - Coimbatore Soft Silk Saree
      { id: 33, pid: 11, sku: 'COI-SLK-PEA-01', barcode: '89010011001', size: 'Free Size', color: 'Peacock Blue & Gold', buy: 2200, sell: 4299, min: 6, stock: 12 },
      { id: 34, pid: 11, sku: 'COI-SLK-MST-02', barcode: '89010011002', size: 'Free Size', color: 'Mustard Gold', buy: 2200, sell: 4299, min: 5, stock: 0 },

      // Product 12 - Bombay Dyeing Bedsheet Set
      { id: 35, pid: 12, sku: 'BOM-BED-FLR-K', barcode: '89010012001', size: 'King (108x108 in)', color: 'Floral Jaipuri', buy: 850, sell: 1799, min: 8, stock: 22 },
      { id: 36, pid: 12, sku: 'BOM-BED-GEO-K', barcode: '89010012002', size: 'King (108x108 in)', color: 'Geometric Indigo', buy: 850, sell: 1799, min: 6, stock: 4 },
    ];

    for (const v of variants) {
      db.prepare(`
        INSERT INTO product_variants (id, product_id, sku, barcode, size, color, purchase_price, selling_price, minimum_stock, current_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          sku = excluded.sku,
          barcode = excluded.barcode,
          size = excluded.size,
          color = excluded.color,
          purchase_price = excluded.purchase_price,
          selling_price = excluded.selling_price,
          minimum_stock = excluded.minimum_stock,
          current_stock = excluded.current_stock
      `).run(v.id, v.pid, v.sku, v.barcode, v.size, v.color, v.buy, v.sell, v.min, v.stock);
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
        ('shop_name', 'ரத்னா விலாஸ் (Ratna Vilas)'),
        ('shop_address', '123 Crosscut Road, Gandhipuram, Coimbatore, Tamil Nadu - 641012'),
        ('shop_phone', '+91 98765 43210'),
        ('shop_email', 'contact@ratnavilas.com'),
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

  // Run Enterprise Dataset Generator (1,000+ records)
  try {
    const { seedEnterpriseDataset } = require('./enterpriseDataGenerator');
    seedEnterpriseDataset(db);
  } catch (err) {
    log.error('Error generating enterprise dataset:', err);
  }

  log.info('Comprehensive database seed completed successfully.');
}

