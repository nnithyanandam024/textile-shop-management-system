import Database from 'better-sqlite3';
import { PasswordService } from '../services/auth/passwordService';
import log from '../logger';

/**
 * Enterprise Data Generator for Ratna Vilas (ரத்னா விலாஸ்)
 * Generates 3,500+ realistic, interconnected textile showroom records across all roles and modules.
 * Includes complete datasets for Attendance, Shifts, Payroll, Advances, Purchases, Sales, Inventory, CRM, Appraisals, and Leave.
 */
export function seedEnterpriseDataset(db: Database.Database) {
  log.info('Starting comprehensive Enterprise Dataset generation (3,500+ records)...');

  const defaultPasswordHash = PasswordService.hashPasswordSync('password123');

  const transaction = db.transaction(() => {
    // ----------------------------------------------------------------
    // 1. SYSTEM ROLES
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO roles (id, name, description, is_system_role, status) VALUES
        (1, 'Owner', 'Full system access and store administrative privileges', 1, 'ACTIVE'),
        (2, 'Manager', 'Access to sales, inventory, purchases, reporting, staff view', 1, 'ACTIVE'),
        (3, 'Cashier', 'Access to POS billing terminal and customer registry', 1, 'ACTIVE'),
        (4, 'Inventory Staff', 'Access to stock movements and product management', 1, 'ACTIVE'),
        (5, 'Accountant', 'Access to financial reports, expenses, payables, staff bank details', 1, 'ACTIVE'),
        (6, 'HR Staff', 'Access to staff master, documents, attendance, leave, performance', 1, 'ACTIVE');
    `);

    // ----------------------------------------------------------------
    // 2. USERS (12 Store Personnel Accounts)
    // ----------------------------------------------------------------
    const usersList = [
      { id: 1, username: 'admin', display_name: 'Store Administrator (Owner)', role_id: 1 },
      { id: 2, username: 'manager', display_name: 'Rajesh Kumar (Store Manager)', role_id: 2 },
      { id: 3, username: 'arun.cashier', display_name: 'Arun Kumar (Head Cashier)', role_id: 3 },
      { id: 4, username: 'priya.sales', display_name: 'Priya Sundaram (Senior Sales)', role_id: 3 },
      { id: 5, username: 'karthik.stock', display_name: 'Karthik Raja (Inventory Specialist)', role_id: 4 },
      { id: 6, username: 'anitha.hr', display_name: 'Anitha Ramesh (HR Lead)', role_id: 6 },
      { id: 7, username: 'suresh.sales', display_name: 'Suresh Mani (Sales Associate)', role_id: 3 },
      { id: 8, username: 'divya.cashier', display_name: 'Divya Venkatesh (Cashier Counter 1)', role_id: 3 },
      { id: 9, username: 'supervisor', display_name: 'Murugan Thangaraj (Floor Supervisor)', role_id: 2 },
      { id: 10, username: 'meena.sales', display_name: 'Meena Natarajan (Silk Section)', role_id: 3 },
      { id: 11, username: 'balaji.inventory', display_name: 'Balaji S (Warehouse Incharge)', role_id: 4 },
      { id: 12, username: 'kavitha.cashier', display_name: 'Kavitha R (Cashier Counter 2)', role_id: 3 },
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, role_id, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        password_hash = excluded.password_hash,
        display_name = excluded.display_name,
        role_id = excluded.role_id,
        is_active = 1
    `);

    for (const u of usersList) {
      insertUser.run(u.id, u.username, defaultPasswordHash, u.display_name, u.role_id);
    }

    // ----------------------------------------------------------------
    // 3. DEPARTMENTS & DESIGNATIONS
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO departments (id, department_code, name, description, status) VALUES
        (1, 'DEP-001', 'Storefront Sales', 'Showroom customer assistance, silk counters, and billing desk', 'ACTIVE'),
        (2, 'DEP-002', 'Inventory & Warehouse', 'Stock intake, barcode tagging, racking, and warehouse audits', 'ACTIVE'),
        (3, 'DEP-003', 'Accounts & Billing', 'Cashier counters, receipts, daily settlement, and ledger', 'ACTIVE'),
        (4, 'DEP-004', 'Store Management', 'Overall store supervision, shifts, and business strategy', 'ACTIVE'),
        (5, 'DEP-005', 'HR & People Operations', 'Staff attendance, leave, payroll, and compliance', 'ACTIVE');

      INSERT OR IGNORE INTO designations (id, designation_code, name, department_id, description, status) VALUES
        (1, 'DES-001', 'Senior Silk Consultant', 1, 'Bridal and traditional silk saree specialist', 'ACTIVE'),
        (2, 'DES-002', 'Sales Associate', 1, 'Daily wear, cotton, and men wear customer assistance', 'ACTIVE'),
        (3, 'DES-003', 'Head Cashier', 3, 'Counter billing, split payment, and cash drawer management', 'ACTIVE'),
        (4, 'DES-004', 'Cashier', 3, 'Express counter billing and barcode scanning', 'ACTIVE'),
        (5, 'DES-005', 'Inventory Specialist', 2, 'Stock audits, inward shipments, and alterations', 'ACTIVE'),
        (6, 'DES-006', 'Warehouse Incharge', 2, 'Warehouse racking, PO verification, and reorder alerts', 'ACTIVE'),
        (7, 'DES-007', 'Floor Supervisor', 4, 'Floor staff coordination and customer escalations', 'ACTIVE'),
        (8, 'DES-008', 'Store Manager', 4, 'Overall shop operations lead', 'ACTIVE'),
        (9, 'DES-009', 'HR & Payroll Specialist', 5, 'Biometric attendance, leave approvals, and payslips', 'ACTIVE');
    `);

    // ----------------------------------------------------------------
    // 4. STAFF PROFILES (12 Profiles with Banks, Emergency & Preferences)
    // ----------------------------------------------------------------
    const staffData = [
      { id: 1, code: 'STF-0001', fn: 'Rajesh', ln: 'Kumar', phone: '+91 98765 11001', email: 'rajesh.manager@ratnavilas.com', dep: 4, des: 8, user: 2, sal: 65000, loc: 'Main Showroom', join: '2023-01-10', shiftId: 2 },
      { id: 2, code: 'STF-0002', fn: 'Arun', ln: 'Kumar', phone: '+91 98765 11002', email: 'arun.cashier@ratnavilas.com', dep: 3, des: 3, user: 3, sal: 32000, loc: 'Counter 1 (Main)', join: '2023-03-15', shiftId: 1 },
      { id: 3, code: 'STF-0003', fn: 'Priya', ln: 'Sundaram', phone: '+91 98765 11003', email: 'priya.sales@ratnavilas.com', dep: 1, des: 1, user: 4, sal: 28000, loc: 'Bridal Silk Section', join: '2023-05-01', shiftId: 1 },
      { id: 4, code: 'STF-0004', fn: 'Karthik', ln: 'Raja', phone: '+91 98765 11004', email: 'karthik.stock@ratnavilas.com', dep: 2, des: 5, user: 5, sal: 26000, loc: 'Central Warehouse', join: '2023-06-10', shiftId: 4 },
      { id: 5, code: 'STF-0005', fn: 'Anitha', ln: 'Ramesh', phone: '+91 98765 11005', email: 'anitha.hr@ratnavilas.com', dep: 5, des: 9, user: 6, sal: 40000, loc: 'Admin Office', join: '2023-02-01', shiftId: 2 },
      { id: 6, code: 'STF-0006', fn: 'Suresh', ln: 'Mani', phone: '+91 98765 11006', email: 'suresh.sales@ratnavilas.com', dep: 1, des: 2, user: 7, sal: 22000, loc: 'Men Ethnic Section', join: '2024-01-15', shiftId: 3 },
      { id: 7, code: 'STF-0007', fn: 'Divya', ln: 'Venkatesh', phone: '+91 98765 11007', email: 'divya.cashier@ratnavilas.com', dep: 3, des: 4, user: 8, sal: 24000, loc: 'Counter 2 (Express)', join: '2024-02-10', shiftId: 3 },
      { id: 8, code: 'STF-0008', fn: 'Murugan', ln: 'Thangaraj', phone: '+91 98765 11008', email: 'murugan.sup@ratnavilas.com', dep: 4, des: 7, user: 9, sal: 45000, loc: 'First Floor Floor', join: '2023-04-12', shiftId: 2 },
      { id: 9, code: 'STF-0009', fn: 'Meena', ln: 'Natarajan', phone: '+91 98765 11009', email: 'meena.silk@ratnavilas.com', dep: 1, des: 1, user: 10, sal: 27000, loc: 'Kanchipuram Silk Lounge', join: '2024-03-01', shiftId: 1 },
      { id: 10, code: 'STF-0010', fn: 'Balaji', ln: 'S', phone: '+91 98765 11010', email: 'balaji.wh@ratnavilas.com', dep: 2, des: 6, user: 11, sal: 29000, loc: 'Basement Racking Hub', join: '2023-08-15', shiftId: 4 },
      { id: 11, code: 'STF-0011', fn: 'Kavitha', ln: 'R', phone: '+91 98765 11011', email: 'kavitha.cashier@ratnavilas.com', dep: 3, des: 4, user: 12, sal: 23000, loc: 'Counter 3 (Festival)', join: '2024-04-01', shiftId: 3 },
      { id: 12, code: 'STF-0012', fn: 'Sundar', ln: 'Pillai', phone: '+91 98765 11012', email: 'sundar.sales@ratnavilas.com', dep: 1, des: 2, user: null, sal: 21000, loc: 'Cotton & Linen Section', join: '2024-05-15', shiftId: 2 },
    ];

    const insertStaff = db.prepare(`
      INSERT INTO staff (id, staff_code, first_name, last_name, phone, email, joining_date, department_id, designation_id, employment_type, status, user_id, work_location, address_line_1, city, state, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'FULL_TIME', 'ACTIVE', ?, ?, ?, 'Coimbatore', 'Tamil Nadu', '641001')
      ON CONFLICT(id) DO UPDATE SET
        staff_code = excluded.staff_code,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        phone = excluded.phone,
        email = excluded.email,
        joining_date = excluded.joining_date,
        department_id = excluded.department_id,
        designation_id = excluded.designation_id,
        user_id = excluded.user_id,
        work_location = excluded.work_location
    `);

    const insertBank = db.prepare(`
      INSERT OR REPLACE INTO staff_bank_details (staff_id, bank_name, account_holder_name, account_number_encrypted, ifsc, payment_method)
      VALUES (?, ?, ?, ?, ?, 'Bank Transfer')
    `);

    const insertEmergency = db.prepare(`
      INSERT OR REPLACE INTO staff_emergency_contacts (staff_id, name, relationship, phone, is_primary)
      VALUES (?, ?, ?, ?, 1)
    `);

    const insertStaffPref = db.prepare(`
      INSERT OR REPLACE INTO staff_preferences (staff_id, default_payment_method, auto_print_receipt, scan_sound_enabled, auto_focus_search, receipt_printer, invoice_printer, theme, language)
      VALUES (?, ?, 1, 1, 1, 'EPSON TM-T82 Thermal', 'HP LaserJet Pro A4', 'LIGHT', 'en')
    `);

    const insertCommission = db.prepare(`
      INSERT OR REPLACE INTO staff_sales_commissions (staff_id, commission_rate, effective_from, status)
      VALUES (?, ?, '2026-01-01', 'ACTIVE')
    `);

    const insertStaffNote = db.prepare(`
      INSERT OR IGNORE INTO staff_notes (id, staff_id, note, created_by)
      VALUES (?, ?, ?, 2)
    `);

    const insertEmploymentHistory = db.prepare(`
      INSERT OR IGNORE INTO staff_employment_history (id, staff_id, department_id, designation_id, manager_id, employment_type, effective_from, reason, created_by)
      VALUES (?, ?, ?, ?, ?, 'FULL_TIME', ?, 'Initial Store Staff Onboarding Placement', 1)
    `);

    for (const s of staffData) {
      const addr = `${(s.id * 14) + 12}, Crosscut Bazaar Road, Gandhipuram`;
      insertStaff.run(s.id, s.code, s.fn, s.ln, s.phone, s.email, s.join, s.dep, s.des, s.user, s.loc, addr);
      insertBank.run(s.id, 'State Bank of India', `${s.fn} ${s.ln}`, `SBIN${10000000000 + s.id}`, 'SBIN0001234');
      insertEmergency.run(s.id, `${s.ln || s.fn} Family`, 'Spouse / Parent', `+91 98400 ${String(20000 + s.id).slice(1)}`);
      insertStaffPref.run(s.id, s.dep === 3 ? 'CASH' : 'UPI');
      insertCommission.run(s.id, s.dep === 1 ? 1.5 : 0.5);

      insertStaffNote.run(s.id, s.id, `Staff member ${s.fn} ${s.ln} completed annual POS & customer service orientation.`);
      insertEmploymentHistory.run(s.id, s.id, s.dep, s.des, s.id === 1 ? null : 1, s.join);
    }

    // ----------------------------------------------------------------
    // 5. STAFF COMPLIANCE DOCUMENTS & CATEGORIES
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO document_categories (id, code, name, description, requires_expiry, requires_verification) VALUES
        (1, 'GOVT_ID', 'Government Issued ID', 'National ID, Aadhaar, Passport, or Voter ID', 1, 1),
        (2, 'ADDRESS_PROOF', 'Address Proof', 'Utility bill, rental agreement, or ration card', 0, 1),
        (3, 'CONTRACT', 'Employment Contract', 'Signed employee agreement & offer letter', 1, 1),
        (4, 'EDUCATION', 'Education Certificate', 'Degree diploma or skill certificate', 0, 1),
        (5, 'BANK_PROOF', 'Bank Account Proof', 'Passbook copy or cancelled cheque', 0, 1),
        (6, 'CERTIFICATE', 'Skill & Safety Certification', 'Retail operations or textile safety certification', 1, 1);

      INSERT OR IGNORE INTO required_staff_documents (category_id, is_required)
      SELECT id, 1 FROM document_categories WHERE code IN ('GOVT_ID', 'ADDRESS_PROOF', 'CONTRACT', 'BANK_PROOF');
    `);

    const insertDoc = db.prepare(`
      INSERT OR IGNORE INTO staff_documents (
        id, staff_id, category_id, document_type, document_name, document_number, issue_date, expiry_date,
        file_name, file_path, file_size, mime_type, verification_status, uploaded_by, verified_by, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, '2023-01-01', ?, ?, ?, 102400, 'application/pdf', 'Verified', 6, 2, '2023-01-15 10:00:00')
    `);

    const insertDocVersion = db.prepare(`
      INSERT OR IGNORE INTO staff_document_versions (id, staff_document_id, version, file_path, file_name, file_size, uploaded_by, upload_reason)
      VALUES (?, ?, 1, ?, ?, 102400, 6, 'Initial onboarding document upload')
    `);

    let docIdCounter = 1;
    for (const s of staffData) {
      // Aadhaar
      const d1 = docIdCounter++;
      const aadhaarNum = `XXXX-XXXX-${String(1000 + s.id * 73).slice(-4)}`;
      insertDoc.run(d1, s.id, 1, 'GOVT_ID', 'Aadhaar Card', aadhaarNum, '2035-12-31', `aadhaar_${s.code}.pdf`, `/documents/staff/${s.code}/aadhaar.pdf`);
      insertDocVersion.run(d1, d1, `/documents/staff/${s.code}/aadhaar.pdf`, `aadhaar_${s.code}.pdf`);

      // Contract
      const d2 = docIdCounter++;
      insertDoc.run(d2, s.id, 3, 'CONTRACT', 'Signed Offer Letter & Agreement', `CNT-2026-${s.id}`, '2027-12-31', `contract_${s.code}.pdf`, `/documents/staff/${s.code}/contract.pdf`);
      insertDocVersion.run(d2, d2, `/documents/staff/${s.code}/contract.pdf`, `contract_${s.code}.pdf`);

      // Bank Proof
      const d3 = docIdCounter++;
      insertDoc.run(d3, s.id, 5, 'BANK_PROOF', 'Bank Passbook Copy', `SBIN${10000000000 + s.id}`, null, `bank_passbook_${s.code}.pdf`, `/documents/staff/${s.code}/bank.pdf`);
      insertDocVersion.run(d3, d3, `/documents/staff/${s.code}/bank.pdf`, `bank_passbook_${s.code}.pdf`);
    }

    // ----------------------------------------------------------------
    // 6. CATEGORIES & BRANDS (Textile Specific)
    // ----------------------------------------------------------------
    const categories = [
      { id: 1, name: 'Silks & Traditional', desc: 'Handwoven pure mulberry and zari wedding silks', parent: null },
      { id: 2, name: 'Cotton & Daily Sarees', desc: 'Breathable handloom and block printed cottons', parent: null },
      { id: 3, name: "Men's Ethnic & Formals", desc: 'Silk dhotis, wedding jubbas, formal shirts and trousers', parent: null },
      { id: 4, name: "Women's Ready-to-Wear", desc: 'Salwar suits, anarkalis, festive lehengas and daily kurtis', parent: null },
      { id: 5, name: 'Kids & Festive Wear', desc: 'Pattu pavadai, boy dhoti kurta sets and festive wear', parent: null },
      { id: 6, name: 'Home Textiles & Suiting', desc: 'Bedsheets, dhotis, unstitched suit lengths and towels', parent: null },
      // Sub-categories
      { id: 7, name: 'Kanchipuram Silk Sarees', desc: 'Pure mulberry silk with rich gold and silver zari', parent: 1 },
      { id: 8, name: 'Soft Silk Sarees', desc: 'Lightweight contemporary pure silk sarees', parent: 1 },
      { id: 9, name: 'Arani & Dharmavaram Silks', desc: 'Traditional South Indian wedding collections', parent: 1 },
      { id: 10, name: 'Coimbatore Cotton Sarees', desc: 'Pure cotton handloom sarees for daily elegance', parent: 2 },
      { id: 11, name: 'Chettinad Cotton Sarees', desc: 'Heritage high-count check and temple border cottons', parent: 2 },
      { id: 12, name: 'Silk Dhotis & Angavastrams', desc: 'Ceremonial 8-yard pure silk dhoti sets with zari', parent: 3 },
      { id: 13, name: 'Men Formal Shirts & Trousers', desc: '100% Giza cotton wrinkle-free business shirts', parent: 3 },
      { id: 14, name: 'Girls Pattu Pavadai Sets', desc: 'Heritage traditional silk skirts and blouses for girls', parent: 5 },
      { id: 15, name: 'Designer Salwar & Chudithar Sets', desc: 'Stitched and unstitched festive dress materials', parent: 4 },
      { id: 16, name: 'Handloom Towels & Bedsheets', desc: '100% pure cotton jacquard bedspreads and bath towels', parent: 6 },
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories (id, name, description, parent_id, is_active)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, parent_id = excluded.parent_id
    `);
    for (const c of categories) insertCat.run(c.id, c.name, c.desc, c.parent);

    const brands = [
      { id: 1, name: 'Kanchipuram Silks', desc: 'Heritage master weavers cooperative' },
      { id: 2, name: 'Ramraj Cotton', desc: 'Traditional South Indian dhotis, shirts and innerwear' },
      { id: 3, name: 'Raymond', desc: 'Luxury formal suiting, shirting and linen fabrics' },
      { id: 4, name: 'FabIndia', desc: 'Authentic Indian handloom, organic dyes and artisan crafts' },
      { id: 5, name: 'Linen Club', desc: 'Premium 100% pure European linen shirting and fabrics' },
      { id: 6, name: 'Manyavar', desc: 'Celebration ethnic wear, kurtas, and sherwanis' },
      { id: 7, name: 'Pothys Weaves', desc: 'Traditional textile creations and silk weaves' },
      { id: 8, name: 'Arani Heritage Handlooms', desc: 'Pure zari traditional Arani weavers guild' },
      { id: 9, name: 'Biba', desc: 'Contemporary Indian ethnic wear and kurtis' },
      { id: 10, name: 'Bombay Dyeing', desc: 'Fine cotton bedsheets, bath towels and drapery' },
      { id: 11, name: 'Co-optex Tamil Nadu', desc: 'Tamil Nadu Handloom Weavers Cooperative' },
      { id: 12, name: 'Surat Silk Mills', desc: 'Fine poly-silk and jacquard fashion fabrics' },
    ];

    const insertBrand = db.prepare(`
      INSERT INTO brands (id, name, description, is_active)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description
    `);
    for (const b of brands) insertBrand.run(b.id, b.name, b.desc);

    // ----------------------------------------------------------------
    // 7. SUPPLIERS & MASTER WEAVERS (35 Suppliers)
    // ----------------------------------------------------------------
    const supplierLocations = ['Kanchipuram', 'Arani', 'Salem', 'Erode', 'Tiruppur', 'Surat', 'Varanasi', 'Coimbatore', 'Madurai', 'Chennai'];
    const supplierTypes = ['Handloom Weavers Society', 'Silk Mills Ltd', 'Textile Traders', 'Cotton Spinners', 'Fabrics Hub'];

    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (id, supplier_code, company_name, contact_person, phone, email, address, city, state, pincode, gst_number, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Tamil Nadu', ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        supplier_code = excluded.supplier_code,
        company_name = excluded.company_name,
        contact_person = excluded.contact_person,
        phone = excluded.phone,
        email = excluded.email,
        address = excluded.address,
        city = excluded.city,
        gst_number = excluded.gst_number
    `);

    for (let i = 1; i <= 35; i++) {
      const code = `SUP-${String(i).padStart(4, '0')}`;
      const loc = supplierLocations[(i - 1) % supplierLocations.length];
      const type = supplierTypes[(i - 1) % supplierTypes.length];
      const company = `${loc} Sri ${type} (#${i})`;
      const contact = `Ramanathan ${String.fromCharCode(65 + (i % 26))}.`;
      const phone = `+91 94440 ${String(10000 + i).slice(1)}`;
      const email = `contact@supplier${i}.textiles.in`;
      const address = `${i * 12}, Weavers Colony, Gandhi Road`;
      const pin = `63150${(i % 5) + 1}`;
      const gstin = `33AAAAA${String(1000 + i)}A1Z${(i % 9) + 1}`;
      insertSupplier.run(i, code, company, contact, phone, email, address, loc, pin, gstin);
    }

    // ----------------------------------------------------------------
    // 8. CUSTOMERS & LOYALTY CRM (150 Customers & Preferences)
    // ----------------------------------------------------------------
    const firstNames = ['Sundaram', 'Meenakshi', 'Kavitha', 'Senthil', 'Vijayalakshmi', 'Karthik', 'Divya', 'Natarajan', 'Shanthi', 'Murugesan', 'Bhuvaneshwari', 'Ganesh', 'Anbarasan', 'Revathi', 'Venkatesan'];
    const lastNames = ['Pillai', 'Natarajan', 'Radhakrishnan', 'Nathan', 'Ramanathan', 'Subramanian', 'Venkatesh', 'Chettiar', 'Iyer', 'Mudaliar', 'Gounder', 'Swaminathan', 'Krishnan', 'Sundaram'];
    const cities = ['Kanchipuram', 'Chennai', 'Coimbatore', 'Salem', 'Madurai', 'Tiruchirappalli', 'Erode', 'Vellore', 'Tiruppur', 'Thanjavur'];
    const tiers = ['BRONZE', 'BRONZE', 'SILVER', 'SILVER', 'GOLD', 'PLATINUM'];

    const insertCustomer = db.prepare(`
      INSERT INTO customers (id, customer_code, name, phone, email, address, city, state, pincode, credit_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Tamil Nadu', ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        customer_code = excluded.customer_code,
        name = excluded.name,
        phone = excluded.phone,
        email = excluded.email,
        address = excluded.address,
        city = excluded.city,
        credit_limit = excluded.credit_limit
    `);

    const insertLoyalty = db.prepare(`
      INSERT INTO loyalty_accounts (customer_id, points_balance, lifetime_points, tier)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(customer_id) DO UPDATE SET
        points_balance = excluded.points_balance,
        lifetime_points = excluded.lifetime_points,
        tier = excluded.tier
    `);

    const insertLoyaltyTx = db.prepare(`
      INSERT OR IGNORE INTO loyalty_transactions (id, customer_id, type, points, reference_type, reference_id, description, created_by)
      VALUES (?, ?, ?, ?, 'SALES_INVOICE', ?, ?, 3)
    `);

    const insertCustPref = db.prepare(`
      INSERT OR REPLACE INTO customer_preferences (customer_id, preferred_categories, preferred_colors, preferred_sizes, preferred_brands, shopping_preferences, dob, anniversary)
      VALUES (?, ?, ?, ?, ?, 'Prefers VIP silk lounge preview & WhatsApp catalog alerts', '1985-05-15', '2010-11-20')
    `);

    const insertCustNote = db.prepare(`
      INSERT OR IGNORE INTO customer_notes (id, customer_id, note, created_by, author_name)
      VALUES (?, ?, ?, 2, 'Rajesh Kumar')
    `);

    let loyaltyTxCounter = 1;
    let custNoteCounter = 1;

    for (let i = 1; i <= 150; i++) {
      const code = `CUST-${String(i).padStart(4, '0')}`;
      const fn = firstNames[(i * 3) % firstNames.length];
      const ln = lastNames[(i * 7) % lastNames.length];
      const name = `${fn} ${ln}`;
      const phone = `+91 98${String(40000000 + i * 137).slice(0, 8)}`;
      const email = `customer${i}@email.com`;
      const city = cities[i % cities.length];
      const address = `${(i * 7) % 150 + 1}, Raja Street, ${city}`;
      const pin = `60000${(i % 9) + 1}`;
      const creditLimit = (i % 5 === 0) ? 25000 : ((i % 10 === 0) ? 50000 : 0);
      const points = (i * 85) % 1500;
      const lifetime = points + (i * 200);
      const tier = tiers[i % tiers.length];

      insertCustomer.run(i, code, name, phone, email, address, city, pin, creditLimit);
      insertLoyalty.run(i, points, lifetime, tier);

      // Customer preference & notes
      insertCustPref.run(
        i,
        i % 2 === 0 ? 'Kanchipuram Silk Sarees, Soft Silks' : 'Cotton Sarees, Men Formal Shirts',
        i % 2 === 0 ? 'Crimson Red, Temple Green, Mustard Gold' : 'Sky Blue, Navy Blue, White',
        'Free Size (6.3m), 40 (M)',
        i % 2 === 0 ? 'Kanchipuram Silks, Pothys Weaves' : 'Ramraj Cotton, Raymond'
      );

      if (i <= 100) {
        insertCustNote.run(
          custNoteCounter++,
          i,
          `Regular family shopper for wedding collections. Highly satisfied with staff customer service.`
        );
      }

      // 2 Loyalty transactions per customer (Earn + Redeem)
      insertLoyaltyTx.run(loyaltyTxCounter++, i, 'EARN', 150, i, 'Points earned on showroom textile shopping');
      if (i % 3 === 0) {
        insertLoyaltyTx.run(loyaltyTxCounter++, i, 'REDEEM', 50, i, 'Reward points redeemed at POS checkout counter');
      }
    }

    // ----------------------------------------------------------------
    // 9. TEXTILE PRODUCTS & VARIANTS (66 Products, 260+ Variants)
    // ----------------------------------------------------------------
    const textileCatalog = [
      // Silks & Traditional
      { name: 'Kanchipuram Pure Zari Bridal Silk Saree', cat: 7, brand: 1, mat: 'Pure Mulberry Silk & Gold Zari', cost: 18000, price: 28500, tax: 5.0, hsn: '5007', colors: ['Crimson Red', 'Royal Blue', 'Temple Green', 'Golden Mustard', 'Peacock Green'], sizes: ['Free Size (6.3m)'] },
      { name: 'Kanchipuram Soft Silk Contrast Border Saree', cat: 8, brand: 1, mat: 'Soft Silk', cost: 6200, price: 9800, tax: 5.0, hsn: '5007', colors: ['Rose Pink', 'Mint Green', 'Lavender', 'Teal Blue', 'Coral Orange'], sizes: ['Free Size (6.3m)'] },
      { name: 'Arani Traditional Korvai Silk Saree', cat: 9, brand: 8, mat: 'Arani Pure Silk', cost: 8500, price: 13500, tax: 5.0, hsn: '5007', colors: ['Maroon & Mustard', 'Navy & Green', 'Violet & Silver', 'Rani Pink & Gold'], sizes: ['Free Size (6.3m)'] },
      { name: 'Dharmavaram Wedding Brocade Silk Saree', cat: 9, brand: 7, mat: 'Pure Silk Brocade', cost: 14000, price: 22000, tax: 5.0, hsn: '5007', colors: ['Dark Purple', 'Emerald Green', 'Wine Red', 'Bridal Yellow'], sizes: ['Free Size (6.3m)'] },
      { name: 'Pothys Heritage Tissue Silk Saree', cat: 8, brand: 7, mat: 'Tissue Silk', cost: 9500, price: 15200, tax: 5.0, hsn: '5007', colors: ['Champagne Gold', 'Rose Gold', 'Silver Metallic', 'Copper Zari'], sizes: ['Free Size (6.3m)'] },

      // Cotton & Daily Sarees
      { name: 'Coimbatore Handloom Pure Cotton Saree', cat: 10, brand: 11, mat: '100% Organic Cotton (80s Count)', cost: 850, price: 1450, tax: 5.0, hsn: '5208', colors: ['Indigo Blue', 'Turmeric Yellow', 'Earthy Brown', 'Forest Green', 'Terracotta'], sizes: ['Free Size (5.5m)'] },
      { name: 'Chettinad Heritage Temple Border Cotton Saree', cat: 11, brand: 11, mat: 'Chettinad Cotton (60s Count)', cost: 1100, price: 1850, tax: 5.0, hsn: '5208', colors: ['Black & Red', 'Mustard & Green', 'Maroon & Mustard', 'Royal Blue & Yellow'], sizes: ['Free Size (5.5m)'] },
      { name: 'FabIndia Hand-Block Printed Chanderi Cotton Saree', cat: 10, brand: 4, mat: 'Chanderi Cotton Silk', cost: 2200, price: 3600, tax: 5.0, hsn: '5208', colors: ['Sage Green', 'Dusty Rose', 'Powder Blue', 'Beige Floral'], sizes: ['Free Size (6.0m)'] },
      { name: 'Sungudi Traditional Tie & Dye Cotton Saree', cat: 10, brand: 11, mat: 'Pure Madurai Cotton', cost: 650, price: 1150, tax: 5.0, hsn: '5208', colors: ['Dark Green', 'Rani Pink', 'Navy Blue', 'Deep Maroon'], sizes: ['Free Size (5.5m)'] },

      // Men's Ethnic & Formals
      { name: 'Ramraj Pure Silk Dhoti & Angavastram Set (2-inch Zari)', cat: 12, brand: 2, mat: 'Pure Silk with Gold Zari', cost: 3800, price: 5950, tax: 5.0, hsn: '6203', colors: ['Pure Cream / Gold', 'Off-White / Silver'], sizes: ['8 Yards + 4 Yards', '9x5 Yards'] },
      { name: 'Ramraj Cotton Mayilkann Panchakacham Dhoti Set', cat: 12, brand: 2, mat: '100% Pure Combed Cotton', cost: 750, price: 1250, tax: 5.0, hsn: '6203', colors: ['White with Green Border', 'White with Maroon Border', 'White with Gold Zari'], sizes: ['8 Mulam', '9x5 Yards'] },
      { name: 'Manyavar Festive Silk Blend Kurta & Churidar Set', cat: 3, brand: 6, mat: 'Jacquard Silk Blend', cost: 2800, price: 4999, tax: 12.0, hsn: '6203', colors: ['Maroon', 'Midnight Blue', 'Mustard Yellow', 'Pista Green', 'Champagne'], sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'] },
      { name: 'Raymond Tailored Fit 100% Egyptian Giza Cotton Shirt', cat: 13, brand: 3, mat: 'Giza Egyptian Cotton', cost: 1450, price: 2499, tax: 12.0, hsn: '6203', colors: ['Crisp White', 'Sky Blue', 'Light Lavender', 'French Blue', 'Classic Navy'], sizes: ['39 (M)', '40 (L)', '42 (XL)', '44 (XXL)'] },
      { name: 'Linen Club Pure French Linen Casual Shirt', cat: 13, brand: 5, mat: '100% Pure European Linen', cost: 1850, price: 3299, tax: 12.0, hsn: '6203', colors: ['Natural Sand', 'Olive Green', 'Sky Blue', 'Salmon Pink', 'White'], sizes: ['39 (M)', '40 (L)', '42 (XL)', '44 (XXL)'] },

      // Women's Ready-to-Wear
      { name: 'Biba Embroidered Anarkali Kurta & Dupatta Set', cat: 15, brand: 9, mat: 'Pure Georgette with Zari Embroidery', cost: 2600, price: 4499, tax: 12.0, hsn: '6204', colors: ['Teal Blue', 'Ruby Wine', 'Emerald Green', 'Mustard Gold'], sizes: ['S (36)', 'M (38)', 'L (40)', 'XL (42)', 'XXL (44)'] },
      { name: 'FabIndia Daily Wear Pure Cotton Straight Kurti', cat: 4, brand: 4, mat: 'Organic Cotton Block Print', cost: 750, price: 1399, tax: 5.0, hsn: '6204', colors: ['Indigo Print', 'Madder Red', 'Kalamkari Ochre', 'Sea Green'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { name: 'Pothys Silk Chudithar Dress Material (Unstitched)', cat: 15, brand: 7, mat: 'Chanderi Silk & Santoon Blends', cost: 1350, price: 2350, tax: 5.0, hsn: '6204', colors: ['Peach & Magenta', 'Teal & Navy', 'Yellow & Maroon', 'Grey & Pink'], sizes: ['Unstitched 3-Piece'] },

      // Kids & Festive Wear
      { name: 'Girls Kanchipuram Pure Silk Pattu Pavadai Set', cat: 14, brand: 1, mat: 'Pure Mulberry Silk with Zari Border', cost: 2400, price: 3950, tax: 5.0, hsn: '6204', colors: ['Magenta & Mustard', 'Peacock Blue & Pink', 'Green & Red', 'Yellow & Violet'], sizes: ['Age 2-4', 'Age 5-7', 'Age 8-10', 'Age 11-13'] },
      { name: 'Boys Ramraj Silk Dhoti & Stitched Shirt Set', cat: 5, brand: 2, mat: 'Art Silk with Gold Zari Border', cost: 850, price: 1450, tax: 5.0, hsn: '6203', colors: ['Cream & Gold Zari', 'White & Maroon Border'], sizes: ['Size 22 (3-4 Yrs)', 'Size 26 (6-7 Yrs)', 'Size 30 (9-10 Yrs)', 'Size 34 (12-13 Yrs)'] },

      // Home Textiles & Suiting
      { name: 'Bombay Dyeing 100% Cotton King Size Double Bedsheet Set', cat: 16, brand: 10, mat: '300 TC Glace Cotton', cost: 1150, price: 1999, tax: 5.0, hsn: '6302', colors: ['Heritage Floral Blue', 'Rose Garden Pink', 'Geometric Beige', 'Paisley Royal Gold'], sizes: ['King Size 108x108 inch + 2 Pillow Covers'] },
      { name: 'Co-optex Pure Cotton Honeycomb Jacquard Bath Towel (Pack of 3)', cat: 16, brand: 11, mat: '100% Combed Cotton', cost: 480, price: 850, tax: 5.0, hsn: '6302', colors: ['Multicolor Pack (Blue, Maroon, Green)'], sizes: ['Standard 75x150 cm'] },
      { name: 'Raymond Unstitched Wool-Blend Executive Suit Length (3.0m)', cat: 6, brand: 3, mat: 'Poly-Wool Blend Luxury Suiting', cost: 2900, price: 5200, tax: 12.0, hsn: '5515', colors: ['Charcoal Grey', 'Midnight Blue', 'Jet Black', 'Chocolate Brown'], sizes: ['3.00 Meters'] },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, category_id, brand_id, material, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category_id = excluded.category_id,
        brand_id = excluded.brand_id,
        material = excluded.material,
        description = excluded.description
    `);

    const insertVariant = db.prepare(`
      INSERT INTO product_variants (id, product_id, sku, barcode, size, color, pattern, purchase_price, selling_price, tax_rate, minimum_stock, current_stock, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        product_id = excluded.product_id,
        sku = excluded.sku,
        barcode = excluded.barcode,
        size = excluded.size,
        color = excluded.color,
        purchase_price = excluded.purchase_price,
        selling_price = excluded.selling_price,
        tax_rate = excluded.tax_rate,
        current_stock = excluded.current_stock
    `);

    let prodIdCounter = 1;
    let variantIdCounter = 1;
    const allVariants: Array<{ id: number; name: string; sku: string; barcode: string; cost: number; price: number; tax: number; hsn: string }> = [];

    for (const item of textileCatalog) {
      const variations = [
        { suffix: '', priceMult: 1.0 },
        { suffix: ' (Grand Wedding Special)', priceMult: 1.15 },
        { suffix: ' (Festive Edition)', priceMult: 1.08 },
      ];

      for (const v of variations) {
        const pId = prodIdCounter++;
        const prodName = `${item.name}${v.suffix}`;
        insertProduct.run(pId, prodName, item.cat, item.brand, item.mat, `Authentic South Indian textile: ${prodName}`);

        for (let cIdx = 0; cIdx < item.colors.length; cIdx++) {
          const color = item.colors[cIdx];
          const size = item.sizes[cIdx % item.sizes.length];
          const vId = variantIdCounter++;
          const sku = `SKU-${String(pId).padStart(3, '0')}-${String(vId).padStart(4, '0')}`;
          const barcode = `8901234${String(100000 + vId).slice(1)}`;
          const cost = Math.round(item.cost * v.priceMult);
          const price = Math.round(item.price * v.priceMult);
          const stock = 15 + ((vId * 7) % 45);

          insertVariant.run(vId, pId, sku, barcode, size, color, 'Traditional Zari / Weave', cost, price, item.tax, 5, stock);
          allVariants.push({ id: vId, name: `${prodName} - ${color} (${size})`, sku, barcode, cost, price, tax: item.tax, hsn: item.hsn });
        }
      }
    }

    log.info(`Generated ${prodIdCounter - 1} Products and ${variantIdCounter - 1} Variants.`);

    // ----------------------------------------------------------------
    // 10. PURCHASES, INWARD RECEIVING & DISCREPANCIES (60 POs)
    // ----------------------------------------------------------------
    const insertPurchase = db.prepare(`
      INSERT INTO purchases (id, purchase_number, supplier_id, purchase_date, subtotal, discount, tax, total, paid_amount, balance_amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        total = excluded.total,
        paid_amount = excluded.paid_amount,
        balance_amount = excluded.balance_amount,
        status = excluded.status
    `);

    const insertPurchaseItem = db.prepare(`
      INSERT INTO purchase_items (purchase_id, product_variant_id, quantity, unit_cost, discount, tax, total)
      VALUES (?, ?, ?, ?, 0.0, ?, ?)
    `);

    const insertStockReceiving = db.prepare(`
      INSERT OR IGNORE INTO stock_receiving_records (id, staff_id, purchase_id, notes, status, reviewed_by, review_comment, reviewed_at)
      VALUES (?, ?, ?, ?, 'VERIFIED', 2, 'Inward shipment barcode verified and quality approved', ?)
    `);

    const insertStockReceivingItem = db.prepare(`
      INSERT OR IGNORE INTO stock_receiving_items (id, receiving_record_id, product_variant_id, ordered_quantity, received_quantity, difference, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertStockTx = db.prepare(`
      INSERT INTO stock_transactions (
        product_variant_id, transaction_type, quantity, reference_type, reference_id,
        previous_quantity, new_quantity, notes, created_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const purchaseNotes = [
      'Inward shipment received from master weaver cooperative - QC passed',
      'Festival bulk restocking for Aadi discount sales event',
      'Wedding collection intake - silk mark verification attached',
      'Urgent replenishment of fast-moving cotton shirts & dhotis',
      'Direct mill lot procurement - payment terms 30 days credit',
    ];

    let receivingItemId = 1;

    for (let i = 1; i <= 60; i++) {
      const pNum = `PO-2026-${String(i).padStart(4, '0')}`;
      const suppId = (i % 35) + 1;
      const daysAgo = 180 - Math.floor((i * 175) / 60);
      const date = new Date(Date.now() - daysAgo * 86400000).toISOString().replace('T', ' ').slice(0, 19);

      let subtotal = 0;
      let totalTax = 0;
      const itemsCount = 3 + (i % 4);
      const itemsToInward: typeof allVariants = [];

      for (let k = 0; k < itemsCount; k++) {
        itemsToInward.push(allVariants[(i * 5 + k * 11) % allVariants.length]);
      }

      for (const item of itemsToInward) {
        const qty = 10 + ((i * 3 + item.id) % 30);
        const itemTot = qty * item.cost;
        const itemTax = itemTot * (item.tax / 100);
        subtotal += itemTot;
        totalTax += itemTax;
      }

      const grandTotal = Math.round(subtotal + totalTax);
      let paid = grandTotal;
      let status = 'COMPLETED';
      let balance = 0;

      if (i % 7 === 0) {
        paid = Math.round(grandTotal * 0.5);
        balance = grandTotal - paid;
        status = 'PARTIAL';
      } else if (i % 13 === 0) {
        paid = 0;
        balance = grandTotal;
        status = 'RECEIVED';
      }

      const note = purchaseNotes[i % purchaseNotes.length];
      insertPurchase.run(i, pNum, suppId, date, subtotal, 0.0, totalTax, grandTotal, paid, balance, status, note);

      for (const item of itemsToInward) {
        const qty = 10 + ((i * 3 + item.id) % 30);
        const itemTot = qty * item.cost;
        const itemTax = itemTot * (item.tax / 100);
        insertPurchaseItem.run(i, item.id, qty, item.cost, itemTax, itemTot + itemTax);

        // Record stock inward transaction
        insertStockTx.run(item.id, 'PURCHASE_INWARD', qty, 'PURCHASE_ORDER', i, 20, 20 + qty, 'Supplier PO Inward Intake', 5, date);
      }

      // Generate Stock Receiving Record for first 30 POs
      if (i <= 30) {
        insertStockReceiving.run(i, (i % 2 === 0 ? 4 : 10), i, `Warehouse Bay Receiving Log - PO #${pNum}`, date);
        for (const item of itemsToInward) {
          const qty = 10 + ((i * 3 + item.id) % 30);
          const diff = (i % 9 === 0) ? -1 : 0;
          insertStockReceivingItem.run(
            receivingItemId++,
            i,
            item.id,
            qty,
            qty + diff,
            diff,
            diff !== 0 ? 'Minor packaging transit damage - debit note raised' : 'Verified OK'
          );
        }
      }
    }

    log.info('Generated 60 Purchase Orders with 250+ Line Items and Stock Receiving Logs.');

    // ----------------------------------------------------------------
    // 11. INVENTORY AUDITS, TRANSFERS & TASKS
    // ----------------------------------------------------------------
    const insertStockCount = db.prepare(`
      INSERT OR IGNORE INTO stock_counts (
        id, staff_id, product_variant_id, location_name, system_quantity, physical_quantity,
        difference, reason, status, reviewed_by, review_comment, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 2, 'Variance reconciliation accepted', datetime('now', '-7 days'))
    `);

    const insertStockTransfer = db.prepare(`
      INSERT OR IGNORE INTO stock_transfer_requests (
        id, staff_id, product_variant_id, from_location, to_location, quantity, reason,
        status, reviewed_by, review_comment, reviewed_at
      ) VALUES (?, ?, ?, 'Central Warehouse', 'First Floor Silk Lounge', ?, ?, 'RECEIVED', 2, 'Transfer approved and dispatched', datetime('now', '-2 days'))
    `);

    const insertInventoryTask = db.prepare(`
      INSERT OR IGNORE INTO inventory_tasks (id, staff_id, task_type, title, description, due_date, status, reference_id)
      VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
    `);

    for (let cId = 1; cId <= 25; cId++) {
      const v = allVariants[(cId * 13) % allVariants.length];
      const diff = (cId % 4 === 0) ? -1 : ((cId % 6 === 0) ? 1 : 0);
      insertStockCount.run(
        cId,
        (cId % 2 === 0 ? 4 : 10),
        v.id,
        cId % 2 === 0 ? 'Main Showroom Counter' : 'Central Warehouse Rack A',
        25,
        25 + diff,
        diff,
        diff !== 0 ? 'Physical audit variance verified against barcode shelf log' : 'Stock matching 100%'
      );
    }

    for (let tId = 1; tId <= 15; tId++) {
      const v = allVariants[(tId * 17) % allVariants.length];
      insertStockTransfer.run(
        tId,
        4,
        v.id,
        10,
        'Replenishing bridal counter stock for weekend wedding rush'
      );
    }

    const taskTypes = ['STOCK_COUNT', 'STOCK_RECEIVING', 'TRANSFER_DISPATCH', 'REORDER_CHECK'] as const;
    for (let tkId = 1; tkId <= 20; tkId++) {
      const type = taskTypes[tkId % taskTypes.length];
      insertInventoryTask.run(
        tkId,
        (tkId % 2 === 0 ? 4 : 10),
        type,
        `Inventory Routine Task #${tkId}: ${type.replace('_', ' ')}`,
        `Inspect and verify shelf inventory levels for ${type}`,
        '2026-08-30',
        tkId
      );
    }

    // ----------------------------------------------------------------
    // 12. HISTORICAL SALES INVOICES, PAYMENTS & RETURNS (400 Invoices)
    // ----------------------------------------------------------------
    const insertSale = db.prepare(`
      INSERT INTO sales (
        id, invoice_number, customer_id, sale_date, subtotal, discount, tax, total, paid_amount, balance_amount,
        status, notes, created_by, created_at, discount_type, round_off_amount, cgst_amount, sgst_amount, is_tax_invoice
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'COMPLETED', ?, ?, ?, 'FIXED', ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        invoice_number = excluded.invoice_number,
        total = excluded.total,
        paid_amount = excluded.paid_amount
    `);

    const insertSaleItem = db.prepare(`
      INSERT INTO sale_items (
        sale_id, product_variant_id, quantity, unit_price, discount, tax, total,
        product_name_snapshot, sku_snapshot, hsn_code_snapshot, tax_rate, tax_amount
      )
      VALUES (?, ?, ?, ?, 0.0, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPayment = db.prepare(`
      INSERT INTO payments (sale_id, payment_method, amount, reference_number, payment_date, notes)
      VALUES (?, ?, ?, ?, ?, 'POS Checkout Settlement')
    `);

    const insertReturn = db.prepare(`
      INSERT OR IGNORE INTO returns (id, return_number, sale_id, customer_id, return_date, return_type, refund_amount, status, reason, created_by)
      VALUES (?, ?, ?, ?, ?, 'REFUND', ?, 'COMPLETED', ?, 3)
    `);

    const insertReturnItem = db.prepare(`
      INSERT OR IGNORE INTO return_items (id, return_id, sale_item_id, product_variant_id, quantity, refund_amount, condition, reason)
      VALUES (?, ?, ?, ?, 1, ?, 'GOOD', ?)
    `);

    const insertHeldSale = db.prepare(`
      INSERT OR IGNORE INTO held_sales (id, staff_id, reference_name, customer_id, cart_data, subtotal, discount_amount, tax_amount, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 0.0, ?, ?, 'HELD')
    `);

    const paymentMethods = ['CASH', 'UPI', 'CARD', 'SPLIT', 'UPI', 'CASH'];
    let returnIdCounter = 1;
    let returnItemIdCounter = 1;

    for (let sId = 1; sId <= 400; sId++) {
      const invNum = `INV-2026-${String(sId).padStart(5, '0')}`;
      const custId = (sId % 150) + 1;
      const cashierId = [3, 4, 7, 8, 10, 12][sId % 6];
      const daysAgo = 90 - Math.floor((sId * 89) / 400);
      const hour = 10 + (sId % 11);
      const minute = (sId * 13) % 60;
      const saleDate = new Date(Date.now() - daysAgo * 86400000);
      saleDate.setHours(hour, minute, 0, 0);
      const saleDateStr = saleDate.toISOString().replace('T', ' ').slice(0, 19);

      const itemCount = (sId % 3) + 1;
      const selectedItems: Array<{ variant: typeof allVariants[0]; qty: number }> = [];
      let subtotal = 0;
      let cgst = 0;
      let sgst = 0;

      for (let k = 0; k < itemCount; k++) {
        const v = allVariants[(sId * 7 + k * 19) % allVariants.length];
        const qty = (k === 0 && sId % 4 === 0) ? 2 : 1;
        selectedItems.push({ variant: v, qty });
        const lineTotal = v.price * qty;
        const lineTax = lineTotal * (v.tax / 100);
        subtotal += lineTotal;
        cgst += lineTax / 2;
        sgst += lineTax / 2;
      }

      const totalTax = cgst + sgst;
      const exactTotal = subtotal + totalTax;
      const roundedTotal = Math.round(exactTotal);
      const roundOff = Number((roundedTotal - exactTotal).toFixed(2));
      const isTaxInvoice = sId % 2 === 0 ? 1 : 0;

      insertSale.run(
        sId,
        invNum,
        custId,
        saleDateStr,
        subtotal,
        0.0,
        totalTax,
        roundedTotal,
        roundedTotal,
        'Showroom Walk-in Sale',
        cashierId,
        saleDateStr,
        roundOff,
        cgst,
        sgst,
        isTaxInvoice
      );

      for (const item of selectedItems) {
        const lineTotal = item.variant.price * item.qty;
        const lineTax = lineTotal * (item.variant.tax / 100);

        insertSaleItem.run(
          sId,
          item.variant.id,
          item.qty,
          item.variant.price,
          lineTax,
          lineTotal + lineTax,
          item.variant.name,
          item.variant.sku,
          item.variant.hsn,
          item.variant.tax,
          lineTax
        );

        insertStockTx.run(item.variant.id, 'SALE', -item.qty, 'SALES_INVOICE', sId, 30, 30 - item.qty, 'POS Counter Sale Deduct', cashierId, saleDateStr);
      }

      const method = paymentMethods[sId % paymentMethods.length];
      if (method === 'SPLIT') {
        const splitCash = Math.floor(roundedTotal / 2);
        const splitUpi = roundedTotal - splitCash;
        insertPayment.run(sId, 'CASH', splitCash, `CASH-${sId}`, saleDateStr);
        insertPayment.run(sId, 'UPI', splitUpi, `UPI-${sId}-REF${1000 + sId}`, saleDateStr);
      } else {
        const ref = method === 'UPI' ? `UPI-TXN-${20260000 + sId}` : (method === 'CARD' ? `AUTH-${500000 + sId}` : `CASH-${sId}`);
        insertPayment.run(sId, method, roundedTotal, ref, saleDateStr);
      }

      // Generate realistic Returns for 20 sales
      if (sId % 20 === 0 && returnIdCounter <= 20) {
        const retNum = `RET-2026-${String(returnIdCounter).padStart(4, '0')}`;
        const retItem = selectedItems[0];
        const retAmount = retItem.variant.price;
        insertReturn.run(returnIdCounter, retNum, sId, custId, saleDateStr, retAmount, 'Size exchange or color preference change');
        insertReturnItem.run(returnItemIdCounter++, returnIdCounter, sId, retItem.variant.id, retAmount, 'Customer requested exchange in different shade');
        returnIdCounter++;
      }
    }

    // 10 Parked / Held Carts
    for (let hId = 1; hId <= 10; hId++) {
      const v = allVariants[(hId * 11) % allVariants.length];
      const cartJson = JSON.stringify([{ id: v.id, name: v.name, price: v.price, qty: 1 }]);
      insertHeldSale.run(hId, (hId % 3) + 3, `Wedding Guest Counter Hold #${hId}`, (hId % 20) + 1, cartJson, v.price, v.price * 0.05, Math.round(v.price * 1.05));
    }

    log.info('Generated 400 Sales Invoices, 400 Payments, 20 Return Audits, and 10 Held Carts.');

    // ----------------------------------------------------------------
    // 13. SHOWROOM OPERATIONAL EXPENSES (50 Records)
    // ----------------------------------------------------------------
    const insertExpense = db.prepare(`
      INSERT OR IGNORE INTO expenses (id, category, description, amount, payment_method, expense_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 2)
    `);

    const expenseCategories = ['Utilities', 'Maintenance', 'Staff Refreshments', 'Packing & Stationery', 'Logistics & Courier', 'Marketing & Festival Decor'];
    for (let eId = 1; eId <= 50; eId++) {
      const cat = expenseCategories[eId % expenseCategories.length];
      const amt = 500 + ((eId * 370) % 8500);
      const daysAgo = 90 - Math.floor((eId * 88) / 50);
      const expDate = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
      const method = eId % 3 === 0 ? 'UPI' : (eId % 4 === 0 ? 'BANK_TRANSFER' : 'CASH');
      insertExpense.run(
        eId,
        cat,
        `Showroom operational expense voucher #${eId} (${cat})`,
        amt,
        method,
        `${expDate} 11:30:00`
      );
    }

    // ----------------------------------------------------------------
    // 14. SHIFTS, ROSTERS, OVERRIDES & REQUESTS
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO shift_templates (id, shift_code, name, start_time, end_time, grace_minutes, break_minutes, minimum_work_minutes, is_overnight, status) VALUES
        (1, 'SFT-001', 'Showroom Morning Shift', '09:00', '18:00', 15, 60, 420, 0, 'ACTIVE'),
        (2, 'SFT-002', 'Showroom General Shift', '10:00', '19:30', 15, 60, 480, 0, 'ACTIVE'),
        (3, 'SFT-003', 'Evening / Peak Weekend Shift', '12:00', '21:00', 10, 60, 420, 0, 'ACTIVE'),
        (4, 'SFT-004', 'Warehouse / Inward Logistics Shift', '08:00', '17:00', 15, 60, 420, 0, 'ACTIVE');
    `);

    const insertShiftAssign = db.prepare(`
      INSERT INTO staff_shift_assignments (staff_id, shift_template_id, effective_from, effective_to, reason, assigned_by)
      VALUES (?, ?, '2026-01-01', NULL, 'Standard showroom roster assignment', 2)
    `);

    const insertScheduleDay = db.prepare(`
      INSERT INTO staff_schedule_days (staff_id, day_of_week, shift_template_id, is_week_off, effective_from)
      VALUES (?, ?, ?, ?, '2026-01-01')
    `);

    const staffWeekOffs: Record<number, number> = {
      1: 0,  // Rajesh Manager: Sunday
      2: 2,  // Arun Head Cashier: Tuesday
      3: 3,  // Priya Senior Silk: Wednesday
      4: 0,  // Karthik Warehouse: Sunday
      5: 0,  // Anitha HR: Sunday
      6: 4,  // Suresh Sales: Thursday
      7: 1,  // Divya Cashier: Monday
      8: 2,  // Murugan Supervisor: Tuesday
      9: 4,  // Meena Silk: Thursday
      10: 0, // Balaji Warehouse: Sunday
      11: 3, // Kavitha Cashier: Wednesday
      12: 1, // Sundar Sales: Monday
    };

    for (const s of staffData) {
      insertShiftAssign.run(s.id, s.shiftId);

      const offDay = staffWeekOffs[s.id] ?? 0;
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        const isOff = dayOfWeek === offDay ? 1 : 0;
        insertScheduleDay.run(s.id, dayOfWeek, isOff ? null : s.shiftId, isOff);
      }
    }

    // Special Festival Shift Overrides
    db.exec(`
      INSERT OR IGNORE INTO staff_shift_overrides (staff_id, override_date, shift_template_id, is_week_off, reason, created_by) VALUES
        (2, '2026-08-15', 3, 0, 'Independence Day Mega Festival Evening Hours', 2),
        (3, '2026-08-15', 3, 0, 'Independence Day Mega Festival Evening Hours', 2),
        (6, '2026-08-15', 3, 0, 'Independence Day Mega Festival Evening Hours', 2),
        (7, '2026-08-15', 3, 0, 'Independence Day Mega Festival Evening Hours', 2),
        (9, '2026-08-15', 3, 0, 'Independence Day Mega Festival Evening Hours', 2),
        (2, '2026-08-28', 3, 0, 'Aadi Discount Rush Extended Counter Hours', 2),
        (3, '2026-08-28', 3, 0, 'Aadi Discount Rush Extended Counter Hours', 2),
        (6, '2026-08-28', 3, 0, 'Aadi Discount Rush Extended Counter Hours', 2);
    `);

    // Shift Change & Swap Requests
    db.exec(`
      INSERT OR IGNORE INTO shift_change_requests (id, staff_id, target_date, requested_shift_template_id, is_requested_week_off, reason, status, reviewed_by, review_comment, reviewed_at) VALUES
        (1, 3, '2026-08-20', 2, 0, 'Need General shift for evening medical appointment', 'APPROVED', 2, 'Approved by Store Manager', '2026-08-18 10:00:00'),
        (2, 6, '2026-08-22', 1, 0, 'Family function in morning - requested morning timing', 'APPROVED', 2, 'Approved', '2026-08-19 11:30:00'),
        (3, 7, '2026-08-25', 1, 0, 'Commute train schedule revision', 'PENDING', NULL, NULL, NULL);

      INSERT OR IGNORE INTO shift_swap_requests (id, requester_staff_id, target_staff_id, shift_date, reason, status, reviewed_by, review_comment, reviewed_at) VALUES
        (1, 2, 7, '2026-08-16', 'Peer swap for weekend cashier counter coverage', 'APPROVED', 2, 'Peer swap accepted by both staff', '2026-08-14 16:00:00'),
        (2, 3, 9, '2026-08-23', 'Silk section weekend wedding rush assistance swap', 'APPROVED', 2, 'Approved', '2026-08-21 14:00:00');
    `);

    log.info('Configured Shift Templates, Assignments, Schedules, Overrides, and Shift Requests.');

    // ----------------------------------------------------------------
    // 15. ATTENDANCE, BIOMETRICS & PERMISSION REQUESTS (720+ Records)
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR REPLACE INTO attendance_settings (id, work_start_time, work_end_time, grace_minutes, full_day_minutes, half_day_minutes, allow_manual_entry, require_approval_for_correction)
      VALUES (1, '09:30', '19:30', 15, 480, 240, 1, 1);
    `);

    const insertAttendance = db.prepare(`
      INSERT INTO attendance (
        staff_id, attendance_date, status, check_in, check_out, worked_minutes,
        late_minutes, early_exit_minutes, permission_minutes, remarks, source, approval_status,
        shift_template_id, scheduled_start, scheduled_end, scheduled_minutes, overtime_minutes, overtime_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BIOMETRIC_DEVICE', 'APPROVED', ?, ?, ?, 480, ?, ?)
      ON CONFLICT(staff_id, attendance_date) DO UPDATE SET
        status = excluded.status,
        check_in = excluded.check_in,
        check_out = excluded.check_out,
        worked_minutes = excluded.worked_minutes,
        late_minutes = excluded.late_minutes,
        overtime_minutes = excluded.overtime_minutes,
        overtime_status = excluded.overtime_status
    `);

    const shiftTimes: Record<number, { start: string; end: string; inStr: string; outStr: string }> = {
      1: { start: '09:00:00', end: '18:00:00', inStr: '08:55:00', outStr: '18:05:00' },
      2: { start: '10:00:00', end: '19:30:00', inStr: '09:55:00', outStr: '19:35:00' },
      3: { start: '12:00:00', end: '21:00:00', inStr: '11:55:00', outStr: '21:05:00' },
      4: { start: '08:00:00', end: '17:00:00', inStr: '07:55:00', outStr: '17:05:00' },
    };

    for (let day = 1; day <= 60; day++) {
      const d = new Date(Date.now() - (60 - day) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();

      for (const s of staffData) {
        const offDay = staffWeekOffs[s.id] ?? 0;
        if (dayOfWeek === offDay) {
          // Rotational week-off
          continue;
        }

        const times = shiftTimes[s.shiftId] || shiftTimes[2];
        const isLate = (day * 3 + s.id) % 13 === 0;
        const isAbsent = (day * 7 + s.id) % 29 === 0;
        const isHalfDay = (day * 5 + s.id) % 23 === 0;
        const hasOvertime = (day * 2 + s.id) % 9 === 0;

        if (isAbsent) {
          insertAttendance.run(
            s.id, dateStr, 'ABSENT', null, null, 0, 0, 0, 0,
            'Planned Personal Leave', s.shiftId, times.start, times.end, 0, 'NOT_APPLICABLE'
          );
        } else if (isHalfDay) {
          insertAttendance.run(
            s.id, dateStr, 'HALF_DAY', times.start, '14:00:00', 240, 0, 0, 0,
            'Approved Half Day Medical Permission', s.shiftId, times.start, times.end, 0, 'NOT_APPLICABLE'
          );
        } else if (isLate) {
          insertAttendance.run(
            s.id, dateStr, 'PRESENT', '09:25:00', times.outStr, 455, 25, 0, 0,
            'Traffic Delay on GST Road', s.shiftId, times.start, times.end, 0, 'NOT_APPLICABLE'
          );
        } else if (hasOvertime) {
          insertAttendance.run(
            s.id, dateStr, 'PRESENT', times.inStr, '21:00:00', 540, 0, 0, 0,
            'Aadi Festival Rush Evening Overtime', s.shiftId, times.start, times.end, 60, 'APPROVED'
          );
        } else {
          insertAttendance.run(
            s.id, dateStr, 'PRESENT', times.inStr, times.outStr, 480, 0, 0, 0,
            'Regular Showroom Shift Completed', s.shiftId, times.start, times.end, 0, 'NOT_APPLICABLE'
          );
        }
      }
    }

    // Attendance Corrections & Permission Requests
    db.exec(`
      INSERT OR IGNORE INTO attendance_corrections (id, attendance_id, original_check_in, original_check_out, original_status, new_check_in, new_check_out, new_status, reason, status, requested_by, reviewed_by, reviewed_at) VALUES
        (1, 15, '09:45:00', '18:00:00', 'PRESENT', '09:00:00', '18:00:00', 'PRESENT', 'Biometric scanner device timeout during morning rush', 'APPROVED', 3, 2, datetime('now', '-5 days')),
        (2, 42, NULL, NULL, 'ABSENT', '10:00:00', '19:30:00', 'PRESENT', 'Assisted stock receiving at warehouse gate - missed biometric punch', 'APPROVED', 4, 2, datetime('now', '-3 days')),
        (3, 78, '09:00:00', '13:00:00', 'HALF_DAY', '09:00:00', '18:00:00', 'PRESENT', 'Full shift completed on silk floor - correction requested', 'PENDING', 9, NULL, NULL);

      INSERT OR IGNORE INTO attendance_correction_requests (id, staff_id, attendance_id, date, requested_check_in, requested_check_out, reason, status, reviewed_by, reviewed_at) VALUES
        (1, 2, 15, '2026-08-10', '09:00:00', '18:00:00', 'Biometric device timeout', 'APPROVED', 2, '2026-08-11 10:00:00'),
        (2, 3, 42, '2026-08-12', '10:00:00', '19:30:00', 'Warehouse gate receiving duty', 'APPROVED', 2, '2026-08-13 11:00:00'),
        (3, 7, 78, '2026-08-15', '09:00:00', '18:00:00', 'Festival rush punch record missed', 'PENDING', NULL, NULL);

      INSERT OR IGNORE INTO permission_requests (id, staff_id, request_date, start_time, end_time, duration_minutes, reason, status, reviewed_by, review_comment, reviewed_at) VALUES
        (1, 2, '2026-08-14', '16:00:00', '18:00:00', 120, 'Bank branch passbook update work', 'APPROVED', 2, 'Approved permission hours', '2026-08-13 17:00:00'),
        (2, 4, '2026-08-18', '08:00:00', '10:00:00', 120, 'Children school bus drop delay', 'APPROVED', 2, 'Approved', '2026-08-17 18:00:00'),
        (3, 9, '2026-08-22', '14:00:00', '16:00:00', 120, 'Medical clinic appointment', 'PENDING', NULL, NULL, NULL);
    `);

    log.info('Generated 720+ Attendance records across 60 days with biometric logs, corrections & permissions.');

    // ----------------------------------------------------------------
    // 16. LEAVE TYPES, BALANCES, ADJUSTMENTS & REQUESTS
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO leave_types (id, leave_code, name, description, paid, annual_allocation, status) VALUES
        (1, 'CL', 'Casual Leave', 'Casual personal time off', 1, 12, 'ACTIVE'),
        (2, 'SL', 'Sick Leave', 'Medical or health related leave', 1, 10, 'ACTIVE'),
        (3, 'EL', 'Earned Leave', 'Earned annual paid leave', 1, 15, 'ACTIVE'),
        (4, 'UL', 'Unpaid Leave', 'Loss of pay leave without fixed quota', 0, 0, 'ACTIVE');

      INSERT OR IGNORE INTO holidays (id, name, holiday_date, type, description) VALUES
        (1, 'Pongal & Harvest Festival', '2026-01-15', 'SHOP', 'State Festival Celebration'),
        (2, 'Republic Day', '2026-01-26', 'PUBLIC', 'National Holiday'),
        (3, 'Tamil New Year (Puthandu)', '2026-04-14', 'SHOP', 'Tamil Traditional Holiday'),
        (4, 'May Day', '2026-05-01', 'PUBLIC', 'Labor Day'),
        (5, 'Independence Day', '2026-08-15', 'PUBLIC', 'National Holiday'),
        (6, 'Gandhi Jayanti', '2026-10-02', 'PUBLIC', 'National Holiday'),
        (7, 'Ayudha Pooja & Vijayadasami', '2026-10-20', 'SHOP', 'Traditional Shop Pooja'),
        (8, 'Diwali Festival', '2026-11-01', 'SHOP', 'Festival Celebration'),
        (9, 'Deepavali Special Holiday', '2026-11-02', 'SHOP', 'Festival Celebration'),
        (10, 'Christmas', '2026-12-25', 'PUBLIC', 'Festival Celebration');
    `);

    const insertLeaveBal = db.prepare(`
      INSERT OR REPLACE INTO leave_balances (staff_id, leave_type_id, year, allocated_days, carry_forward_days, used_days, adjustment_days)
      VALUES (?, ?, 2026, ?, 0, ?, 0)
    `);

    for (const s of staffData) {
      insertLeaveBal.run(s.id, 1, 12, (s.id % 4) + 1); // CL
      insertLeaveBal.run(s.id, 2, 10, (s.id % 3));     // SL
      insertLeaveBal.run(s.id, 3, 15, (s.id % 5) + 2); // EL
    }

    const insertLeave = db.prepare(`
      INSERT OR IGNORE INTO leave_requests (
        id, staff_id, leave_type_id, start_date, end_date, duration_days,
        duration_type, reason, status, requested_at, approved_by, approved_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'FULL_DAY', ?, ?, ?, 2, ?)
    `);

    const leaveReasons = [
      'Family temple festival celebration in Madurai',
      'Medical checkup and dental consultation',
      'Attending cousin wedding reception in Coimbatore',
      'Children school annual day & parent meeting',
      'Home renovation and electrical repair works',
    ];

    for (let lId = 1; lId <= 35; lId++) {
      const sId = (lId % 12) + 1;
      const typeId = (lId % 3) + 1;
      const dayOffset = (lId * 4) % 75;
      const sDate = new Date(Date.now() - dayOffset * 86400000).toISOString().slice(0, 10);
      const reason = leaveReasons[lId % leaveReasons.length];
      const status = (lId % 6 === 0) ? 'PENDING' : 'APPROVED';
      insertLeave.run(lId, sId, typeId, sDate, sDate, 1.0, reason, status, `${sDate} 08:00:00`, `${sDate} 09:30:00`);
    }

    db.exec(`
      INSERT OR IGNORE INTO leave_balance_adjustments (id, staff_id, leave_type_id, year, adjustment_days, reason, created_by) VALUES
        (1, 1, 3, 2026, 2, 'Annual festival loyalty leave grant', 1),
        (2, 2, 3, 2026, 2, 'Annual festival loyalty leave grant', 1),
        (3, 5, 3, 2026, 2, 'HR operational excellence bonus leave', 1);
    `);

    log.info('Generated Leave Master, 2026 Balances, Adjustments, and 35 Leave Applications.');

    // ----------------------------------------------------------------
    // 17. SALARY COMPONENTS, ADVANCES & 4 MONTHS PAYROLL (May-Aug 2026)
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO salary_components (id, code, name, type, calculation_method, default_value, status) VALUES
        (1, 'BASIC', 'Basic Salary', 'EARNING', 'FIXED', 0, 'ACTIVE'),
        (2, 'HRA', 'House Rent Allowance (HRA)', 'EARNING', 'PERCENTAGE_OF_BASIC', 40, 'ACTIVE'),
        (3, 'CONVEYANCE', 'Conveyance Allowance', 'EARNING', 'FIXED', 2000, 'ACTIVE'),
        (4, 'SPECIAL', 'Special Floor Allowance', 'EARNING', 'FIXED', 0, 'ACTIVE'),
        (5, 'OVERTIME', 'Approved Overtime Pay', 'EARNING', 'PER_HOUR', 150, 'ACTIVE'),
        (6, 'PF', 'Provident Fund (PF - 12%)', 'DEDUCTION', 'PERCENTAGE_OF_BASIC', 12, 'ACTIVE'),
        (7, 'ESI', 'Employee State Insurance (ESI - 0.75%)', 'DEDUCTION', 'PERCENTAGE_OF_GROSS', 0.75, 'ACTIVE'),
        (8, 'PT', 'Professional Tax', 'DEDUCTION', 'FIXED', 200, 'ACTIVE'),
        (9, 'ADVANCE', 'Salary Advance Recovery', 'DEDUCTION', 'FIXED', 0, 'ACTIVE'),
        (10, 'UNPAID_LEAVE', 'Unpaid Leave / LOP Deduction', 'DEDUCTION', 'PER_DAY', 0, 'ACTIVE');
    `);

    const insertSalaryStructure = db.prepare(`
      INSERT OR REPLACE INTO salary_structures (id, staff_id, effective_from, pay_frequency, basic_salary, gross_salary, status)
      VALUES (?, ?, '2026-01-01', 'MONTHLY', ?, ?, 'ACTIVE')
    `);

    const insertSalaryCompMap = db.prepare(`
      INSERT INTO salary_structure_components (salary_structure_id, component_id, calculation_method, value)
      VALUES (?, ?, ?, ?)
    `);

    for (const s of staffData) {
      const basic = Math.round(s.sal * 0.5);
      const hra = Math.round(basic * 0.4);
      const conveyance = 2000;
      const special = s.sal - (basic + hra + conveyance);

      insertSalaryStructure.run(s.id, s.id, basic, s.sal);

      insertSalaryCompMap.run(s.id, 1, 'FIXED', basic);
      insertSalaryCompMap.run(s.id, 2, 'PERCENTAGE_OF_BASIC', 40);
      insertSalaryCompMap.run(s.id, 3, 'FIXED', conveyance);
      insertSalaryCompMap.run(s.id, 4, 'FIXED', special > 0 ? special : 0);
      insertSalaryCompMap.run(s.id, 6, 'PERCENTAGE_OF_BASIC', 12);
      insertSalaryCompMap.run(s.id, 7, 'PERCENTAGE_OF_GROSS', 0.75);
      insertSalaryCompMap.run(s.id, 8, 'FIXED', 200);
    }

    // Salary Advances (8 Records with EMI tracking)
    db.exec(`
      INSERT OR IGNORE INTO salary_advances (id, staff_id, amount, advance_date, reason, monthly_installment, remaining_amount, status, approved_by, created_by) VALUES
        (1, 2, 20000, '2026-05-10', 'Festival advance for children school admission', 4000, 8000, 'ACTIVE', 1, 2),
        (2, 3, 15000, '2026-06-05', 'Emergency household appliance purchase', 3000, 6000, 'ACTIVE', 1, 2),
        (3, 6, 25000, '2026-04-12', 'Medical dental procedure & surgery support', 5000, 5000, 'ACTIVE', 1, 2),
        (4, 7, 10000, '2026-07-01', 'Two-wheeler maintenance and road tax', 2500, 7500, 'ACTIVE', 1, 2),
        (5, 9, 30000, '2026-05-20', 'Family wedding jewellery advance', 6000, 12000, 'ACTIVE', 1, 2),
        (6, 10, 12000, '2026-06-15', 'House painting & seasonal maintenance', 3000, 6000, 'ACTIVE', 1, 2),
        (7, 11, 15000, '2026-07-10', 'Festival advance for Pongal celebration savings', 3000, 12000, 'ACTIVE', 1, 2),
        (8, 4, 18000, '2026-05-01', 'Higher education laptop purchase', 3000, 6000, 'ACTIVE', 1, 2);
    `);

    // Payroll Periods (May, June, July, August 2026)
    db.exec(`
      INSERT OR IGNORE INTO payroll_periods (id, name, year, month, start_date, end_date, total_working_days, status, processed_at, approved_by, approved_at, locked_at) VALUES
        (1, 'May 2026 Payroll', 2026, 5, '2026-05-01', '2026-05-31', 26, 'LOCKED', '2026-05-31 18:00:00', 1, '2026-05-31 19:30:00', '2026-06-01 10:00:00'),
        (2, 'June 2026 Payroll', 2026, 6, '2026-06-01', '2026-06-30', 26, 'LOCKED', '2026-06-30 18:00:00', 1, '2026-06-30 19:30:00', '2026-07-01 10:00:00'),
        (3, 'July 2026 Payroll', 2026, 7, '2026-07-01', '2026-07-31', 27, 'LOCKED', '2026-07-31 18:00:00', 1, '2026-07-31 19:30:00', '2026-08-01 10:00:00'),
        (4, 'August 2026 Payroll', 2026, 8, '2026-08-01', '2026-08-31', 26, 'APPROVED', '2026-08-25 18:00:00', 1, '2026-08-25 19:30:00', NULL);
    `);

    const insertPayrollRecord = db.prepare(`
      INSERT INTO payroll_records (
        id, payroll_period_id, staff_id, basic_salary, gross_earnings, overtime_hours, overtime_amount,
        working_days, present_days, paid_leave_days, unpaid_leave_days, unpaid_leave_deduction,
        advance_deduction, other_deductions, total_deductions, net_salary, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(payroll_period_id, staff_id) DO UPDATE SET
        gross_earnings = excluded.gross_earnings,
        total_deductions = excluded.total_deductions,
        net_salary = excluded.net_salary
    `);

    const insertLineItem = db.prepare(`
      INSERT INTO payroll_line_items (payroll_record_id, component_code, component_name, type, amount, calculation_source)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertOvertimeRecord = db.prepare(`
      INSERT OR IGNORE INTO overtime_records (id, staff_id, attendance_id, date, hours, rate, amount, status, approved_by, approved_at, notes)
      VALUES (?, ?, ?, ?, ?, 150, ?, 'APPROVED', 2, ?, 'Weekend festival surge counter coverage')
    `);

    const insertStaffIncentive = db.prepare(`
      INSERT OR IGNORE INTO staff_incentives (id, staff_id, period_name, incentive_type, amount, target_achievement, reason, status, approved_by)
      VALUES (?, ?, ?, 'SALES_COMMISSION', ?, 115.0, 'Exceeded monthly silk counter sales revenue quota', 'APPROVED', 2)
    `);

    const insertPayslip = db.prepare(`
      INSERT OR IGNORE INTO payslips (id, payroll_record_id, staff_id, period_name, file_path, status)
      VALUES (?, ?, ?, ?, ?, 'GENERATED')
    `);

    let prIdCounter = 1;
    let otRecordId = 1;
    let incRecordId = 1;
    let payslipIdCounter = 1;

    const periods = [
      { id: 1, name: 'May 2026', workingDays: 26, status: 'PAID' },
      { id: 2, name: 'June 2026', workingDays: 26, status: 'PAID' },
      { id: 3, name: 'July 2026', workingDays: 27, status: 'PAID' },
      { id: 4, name: 'August 2026', workingDays: 26, status: 'APPROVED' },
    ];

    for (const p of periods) {
      for (const s of staffData) {
        const prId = prIdCounter++;
        const basic = Math.round(s.sal * 0.5);
        const hra = Math.round(basic * 0.4);
        const conveyance = 2000;
        const special = s.sal - (basic + hra + conveyance);
        const otHours = (s.id % 3 === 0) ? 8 : ((s.id % 2 === 0) ? 4 : 0);
        const otAmount = otHours * 150;

        const gross = s.sal + otAmount;

        const pf = Math.round(basic * 0.12);
        const esi = Math.round(gross * 0.0075);
        const pt = 200;
        const advanceEmi = (s.id === 2 ? 4000 : (s.id === 3 ? 3000 : (s.id === 6 ? 5000 : (s.id === 7 ? 2500 : (s.id === 9 ? 6000 : 0)))));

        const totalDeductions = pf + esi + pt + advanceEmi;
        const net = gross - totalDeductions;

        insertPayrollRecord.run(
          prId,
          p.id,
          s.id,
          basic,
          gross,
          otHours,
          otAmount,
          p.workingDays,
          p.workingDays - 1,
          1,
          0,
          0,
          advanceEmi,
          pf + esi + pt,
          totalDeductions,
          net,
          p.status
        );

        // Payslip Line Items
        insertLineItem.run(prId, 'BASIC', 'Basic Salary', 'EARNING', basic, 'FIXED');
        insertLineItem.run(prId, 'HRA', 'House Rent Allowance (HRA)', 'EARNING', hra, 'PERCENTAGE_OF_BASIC');
        insertLineItem.run(prId, 'CONVEYANCE', 'Conveyance Allowance', 'EARNING', conveyance, 'FIXED');
        if (special > 0) insertLineItem.run(prId, 'SPECIAL', 'Special Floor Allowance', 'EARNING', special, 'FIXED');
        if (otAmount > 0) insertLineItem.run(prId, 'OVERTIME', 'Overtime Hours Pay', 'EARNING', otAmount, `${otHours} hrs @ ₹150/hr`);

        insertLineItem.run(prId, 'PF', 'Provident Fund (PF Employee)', 'DEDUCTION', pf, '12% of Basic');
        insertLineItem.run(prId, 'ESI', 'Employee State Insurance', 'DEDUCTION', esi, '0.75% of Gross');
        insertLineItem.run(prId, 'PT', 'Professional Tax', 'DEDUCTION', pt, 'State Sched');
        if (advanceEmi > 0) insertLineItem.run(prId, 'ADVANCE', 'Salary Advance Recovery', 'DEDUCTION', advanceEmi, 'Monthly EMI');

        // Metadata Payslip
        insertPayslip.run(payslipIdCounter++, prId, s.id, p.name, `/payslips/${s.code}_${p.name.replace(' ', '_')}.pdf`);

        // Overtime Record
        if (otHours > 0) {
          insertOvertimeRecord.run(otRecordId++, s.id, prId, '2026-08-15', otHours, otAmount, '2026-08-16 10:00:00');
        }

        // Staff Sales Incentive (for sales and cashier roles)
        if (s.dep === 1 || s.dep === 3) {
          const incAmt = 1500 + ((s.id * 350) % 2500);
          insertStaffIncentive.run(incRecordId++, s.id, p.name, incAmt);
        }
      }
    }

    log.info(`Generated 4 Payroll Periods with 48 Staff Payroll Records & ${prIdCounter * 8} detailed Payslip Line Items.`);

    // ----------------------------------------------------------------
    // 18. PERFORMANCE MANAGEMENT & APPRAISALS
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO appraisal_cycles (id, name, type, start_date, end_date, status, created_by) VALUES
        (1, 'Q1 2026 Performance Appraisal Cycle', 'QUARTERLY', '2026-01-01', '2026-03-31', 'CLOSED', 1),
        (2, 'Q2 2026 Performance Appraisal Cycle', 'QUARTERLY', '2026-04-01', '2026-06-30', 'CLOSED', 1),
        (3, 'Q3 2026 Festive Season Appraisal Cycle', 'QUARTERLY', '2026-07-01', '2026-09-30', 'OPEN', 1);
    `);

    const insertGoal = db.prepare(`
      INSERT OR IGNORE INTO performance_goals (
        id, staff_id, cycle_id, title, description, category, target_value, current_value,
        unit, weight, priority, start_date, due_date, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 25, 'HIGH', '2026-04-01', '2026-06-30', 'COMPLETED', 2)
    `);

    const insertStaffKPI = db.prepare(`
      INSERT OR IGNORE INTO staff_performance_kpis (id, staff_id, kpi_id, cycle_id, target, actual_result, weight, score_achievement, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `);

    const insertReview = db.prepare(`
      INSERT OR IGNORE INTO performance_reviews (
        id, staff_id, cycle_id, reviewer_id, review_type, status, overall_score, overall_rating,
        strengths, areas_for_improvement, comments, submitted_at, approved_at
      ) VALUES (?, ?, ?, 2, 'MANAGER_REVIEW', 'APPROVED', ?, ?, ?, ?, 'Overall outstanding contribution to textile showroom targets', '2026-07-05 10:00:00', '2026-07-06 15:00:00')
    `);

    const insertSelfReview = db.prepare(`
      INSERT OR IGNORE INTO performance_self_reviews (id, review_id, staff_id, achievements, challenges, training_needs, employee_comments)
      VALUES (?, ?, ?, 'Achieved 120% silk counter target and managed bridal customer lounge with 0 escalations', 'Peak weekend counter rush handling', 'Advanced silk saree draping & bridal consultation workshop', 'Happy with team collaboration and support')
    `);

    const insertAppraisal = db.prepare(`
      INSERT OR IGNORE INTO appraisals (
        id, staff_id, cycle_id, review_id, current_salary, recommended_increment_type, recommended_increment_value,
        recommended_incentive, reason, status, approved_by, approved_at, effective_from
      ) VALUES (?, ?, ?, ?, ?, 'PERCENTAGE', 10.0, 5000, 'Consistent top performer in bridal silk and customer retention', 'APPROVED', 1, '2026-07-10 12:00:00', '2026-08-01')
    `);

    const insertPerfIncentive = db.prepare(`
      INSERT OR IGNORE INTO performance_incentives (id, staff_id, cycle_id, appraisal_id, amount, reason, status, approved_by)
      VALUES (?, ?, 2, ?, 5000, 'Q2 2026 Top Sales & Punctuality Award', 'APPROVED', 1)
    `);

    let goalIdCounter = 1;
    let staffKpiId = 1;

    for (const s of staffData) {
      // 3 Performance Goals per staff
      insertGoal.run(goalIdCounter++, s.id, 2, 'Exceed Showroom Monthly Sales Revenue', 'Achieve individual section gross target of ₹5,00,000', 'SALES', 500000, 560000, '₹');
      insertGoal.run(goalIdCounter++, s.id, 2, 'Maintain Punctuality & 95% Attendance', 'Zero unexcused late arrivals or biometric misses', 'ATTENDANCE', 95, 98, '%');
      insertGoal.run(goalIdCounter++, s.id, 2, 'Deliver 5-Star Customer Service', 'Achieve zero customer escalations and assist silk VIP lounge', 'CUSTOMER_SERVICE', 100, 100, '%');

      // Staff KPI mappings
      insertStaffKPI.run(staffKpiId++, s.id, 1, 2, 500000, 560000, 40, 112.0);
      insertStaffKPI.run(staffKpiId++, s.id, 2, 2, 95, 98, 30, 103.1);
      insertStaffKPI.run(staffKpiId++, s.id, 3, 2, 90, 95, 30, 105.5);

      // Performance Review & Self Review
      const revScore = 88 + (s.id % 10);
      const rating = revScore >= 90 ? 'Excellent' : 'Very Good';
      insertReview.run(
        s.id,
        s.id,
        2,
        revScore,
        rating,
        'Punctual, energetic, expert product knowledge of Kanchipuram and cotton weaves',
        'Continue mentoring junior sales associates during festival peak'
      );
      insertSelfReview.run(s.id, s.id, s.id);

      // Appraisal & Increment
      insertAppraisal.run(s.id, s.id, 2, s.id, s.sal);
      insertPerfIncentive.run(s.id, s.id, s.id);
    }

    log.info('Generated Appraisal Cycles, Goals, Scorecards, Reviews, and Increment Records.');

    // ----------------------------------------------------------------
    // 19. COMMUNICATIONS, MESSAGES & ANNOUNCEMENTS
    // ----------------------------------------------------------------
    db.exec(`
      INSERT OR IGNORE INTO announcements (id, title, content, priority, target_type, status, created_by) VALUES
        (1, 'ஆடி தள்ளுபடி திருவிழா சிறப்பு வழிகாட்டுதல்கள் (Aadi Sale Guidelines)', 'Dear Staff, Special extended store hours (09:00 AM - 09:30 PM) apply during the Aadi festival weekend. Complimentary snacks & dinner provided.', 'HIGH', 'ALL_STAFF', 'PUBLISHED', 1),
        (2, 'சுதந்திர தின விழா சிறப்பு போனஸ் அறிவிப்பு (Independence Day Bonus)', 'Management is pleased to announce a festival incentive of ₹2,000 for all staff on duty during Independence Day.', 'NORMAL', 'ALL_STAFF', 'PUBLISHED', 1),
        (3, 'புதிய பட்டு ரகங்கள் அறிமுகம் (New Bridal Silk Collection Arrival)', 'Fresh consignment of 200+ Arani & Kanchipuram Bridal silks received in VIP Lounge. Staff training today at 04:00 PM.', 'NORMAL', 'ALL_STAFF', 'PUBLISHED', 2);

      INSERT OR IGNORE INTO staff_messages (id, sender_user_id, recipient_user_id, recipient_staff_id, subject, message, priority, is_read) VALUES
        (1, 2, 3, 2, 'Weekend Cash Drawer Audit', 'Arun, please ensure Cash Counter 1 drawer closing settlement is completed before 09:30 PM.', 'HIGH', 1),
        (2, 2, 4, 3, 'Bridal Lounge Customer Booking', 'Priya, VIP client family arriving at 11:30 AM for wedding silk saree preview.', 'NORMAL', 1),
        (3, 6, 2, 1, 'August 2026 Payroll Summary Ready', 'Rajesh, August payroll snapshot has been processed with all overtime hours verified.', 'HIGH', 0);
    `);

    // ----------------------------------------------------------------
    // 20. SYSTEM NOTIFICATIONS & ALERTS
    // ----------------------------------------------------------------
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        role_target TEXT DEFAULT 'ALL',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'SUCCESS', 'CRITICAL')),
        is_read INTEGER DEFAULT 0,
        link_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const notifications = [
      { title: 'ஆடி தள்ளுபடி விற்பனை இலக்கு எட்டப்பட்டது!', msg: 'Daily sales crossed ₹2,50,000 across POS counters today.', type: 'SUCCESS', role: 'ALL' },
      { title: 'குறைந்த இருப்பு எச்சரிக்கை (Low Stock Alert)', msg: 'Kanchipuram Pure Zari Silk (Crimson Red) is below 5 units.', type: 'WARNING', role: 'INVENTORY' },
      { title: 'புதிய நெசவாளர் சரக்கு வரவு (Inward PO Completed)', msg: 'PO-2026-0048 from Arani Handlooms has been verified and stocked.', type: 'INFO', role: 'MANAGER' },
      { title: 'பணியாளர் விடுப்பு விண்ணப்பம் (Leave Application)', msg: 'Priya Sundaram applied for Casual Leave on 2026-08-28.', type: 'INFO', role: 'HR' },
      { title: 'தினசரி கணக்கு முடிப்பு தயார் (Daily Cash Closure)', msg: 'Cash Drawer 1 counter closing matched with 0 discrepancy.', type: 'SUCCESS', role: 'CASHIER' },
      { title: 'AI விற்பனை கணிப்பு (AI Demand Surge Forecast)', msg: 'Bridal Silk sarees demand expected to increase 35% this weekend.', type: 'INFO', role: 'MANAGER' },
      { title: 'ஆகஸ்ட் மாத ஊதியப்பட்டியல் தயார் (August Payroll Ready)', msg: 'August 2026 Payroll Period calculated and approved for disbursement.', type: 'SUCCESS', role: 'ACCOUNTANT' },
      { title: 'பயோமெட்ரிக் வருகை பதிவு திருத்தம் (Attendance Correction)', msg: 'Arun Kumar submitted a check-in time correction request for review.', type: 'INFO', role: 'HR' },
    ];

    const insertNotification = db.prepare(`
      INSERT INTO system_notifications (title, message, type, role_target, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now', '-1 hours'))
    `);

    for (const n of notifications) {
      insertNotification.run(n.title, n.msg, n.type, n.role);
    }
  });

  transaction();
  log.info('Enterprise Dataset generation successfully completed! (3,500+ records in database).');
}
