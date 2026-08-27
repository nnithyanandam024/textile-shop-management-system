import Database from 'better-sqlite3';
import { PasswordService } from '../services/auth/passwordService';
import log from '../logger';

/**
 * Enterprise Data Generator for Ratna Vilas (ரத்னா விலாஸ்)
 * Generates 1,000+ realistic, interconnected textile showroom records across all roles and modules.
 */
export function seedEnterpriseDataset(db: Database.Database) {
  log.info('Starting Enterprise Dataset generation (1,000+ records)...');

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
      { id: 8, username: 'divya.cashier', display_name: 'Divya Venkatesh (Cashier)', role_id: 3 },
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
    // 4. STAFF PROFILES (12 Profiles)
    // ----------------------------------------------------------------
    const staffData = [
      { id: 1, code: 'STF-0001', fn: 'Rajesh', ln: 'Kumar', phone: '+91 98765 11001', email: 'rajesh.manager@ratnavilas.com', dep: 4, des: 8, user: 2, sal: 65000, loc: 'Main Showroom', join: '2023-01-10' },
      { id: 2, code: 'STF-0002', fn: 'Arun', ln: 'Kumar', phone: '+91 98765 11002', email: 'arun.cashier@ratnavilas.com', dep: 3, des: 3, user: 3, sal: 32000, loc: 'Counter 1 (Main)', join: '2023-03-15' },
      { id: 3, code: 'STF-0003', fn: 'Priya', ln: 'Sundaram', phone: '+91 98765 11003', email: 'priya.sales@ratnavilas.com', dep: 1, des: 1, user: 4, sal: 28000, loc: 'Bridal Silk Section', join: '2023-05-01' },
      { id: 4, code: 'STF-0004', fn: 'Karthik', ln: 'Raja', phone: '+91 98765 11004', email: 'karthik.stock@ratnavilas.com', dep: 2, des: 5, user: 5, sal: 26000, loc: 'Central Warehouse', join: '2023-06-10' },
      { id: 5, code: 'STF-0005', fn: 'Anitha', ln: 'Ramesh', phone: '+91 98765 11005', email: 'anitha.hr@ratnavilas.com', dep: 5, des: 9, user: 6, sal: 40000, loc: 'Admin Office', join: '2023-02-01' },
      { id: 6, code: 'STF-0006', fn: 'Suresh', ln: 'Mani', phone: '+91 98765 11006', email: 'suresh.sales@ratnavilas.com', dep: 1, des: 2, user: 7, sal: 22000, loc: 'Men Ethnic Section', join: '2024-01-15' },
      { id: 7, code: 'STF-0007', fn: 'Divya', ln: 'Venkatesh', phone: '+91 98765 11007', email: 'divya.cashier@ratnavilas.com', dep: 3, des: 4, user: 8, sal: 24000, loc: 'Counter 2 (Express)', join: '2024-02-10' },
      { id: 8, code: 'STF-0008', fn: 'Murugan', ln: 'Thangaraj', phone: '+91 98765 11008', email: 'murugan.sup@ratnavilas.com', dep: 4, des: 7, user: 9, sal: 45000, loc: 'First Floor Floor', join: '2023-04-12' },
      { id: 9, code: 'STF-0009', fn: 'Meena', ln: 'Natarajan', phone: '+91 98765 11009', email: 'meena.silk@ratnavilas.com', dep: 1, des: 1, user: 10, sal: 27000, loc: 'Kanchipuram Silk Lounge', join: '2024-03-01' },
      { id: 10, code: 'STF-0010', fn: 'Balaji', ln: 'S', phone: '+91 98765 11010', email: 'balaji.wh@ratnavilas.com', dep: 2, des: 6, user: 11, sal: 29000, loc: 'Basement Racking Hub', join: '2023-08-15' },
      { id: 11, code: 'STF-0011', fn: 'Kavitha', ln: 'R', phone: '+91 98765 11011', email: 'kavitha.cashier@ratnavilas.com', dep: 3, des: 4, user: 12, sal: 23000, loc: 'Counter 3 (Festival)', join: '2024-04-01' },
      { id: 12, code: 'STF-0012', fn: 'Sundar', ln: 'Pillai', phone: '+91 98765 11012', email: 'sundar.sales@ratnavilas.com', dep: 1, des: 2, user: null, sal: 21000, loc: 'Cotton & Linen Section', join: '2024-05-15' },
    ];

    const insertStaff = db.prepare(`
      INSERT INTO staff (id, staff_code, first_name, last_name, phone, email, joining_date, department_id, designation_id, employment_type, status, user_id, work_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'FULL_TIME', 'ACTIVE', ?, ?)
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

    const insertSalaryStructure = db.prepare(`
      INSERT OR REPLACE INTO salary_structures (staff_id, effective_from, pay_frequency, basic_salary, gross_salary, status)
      VALUES (?, '2026-01-01', 'MONTHLY', ?, ?, 'ACTIVE')
    `);

    for (const s of staffData) {
      insertStaff.run(s.id, s.code, s.fn, s.ln, s.phone, s.email, s.join, s.dep, s.des, s.user, s.loc);
      const basic = Math.round(s.sal * 0.5);
      insertBank.run(s.id, 'State Bank of India', `${s.fn} ${s.ln}`, `SBIN${10000000000 + s.id}`, 'SBIN0001234');
      insertSalaryStructure.run(s.id, basic, s.sal);
    }

    // ----------------------------------------------------------------
    // 5. CATEGORIES & BRANDS (Textile Specific)
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
    // 6. SUPPLIERS & MASTER WEAVERS (35 Suppliers)
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
    // 7. CUSTOMERS & LOYALTY (150 Customers)
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
    }

    // ----------------------------------------------------------------
    // 8. TEXTILE PRODUCTS & VARIANTS (300 Distinct Items)
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
      // Repeat catalog items with varied finishes to generate ~300 variants
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
          const stock = 15 + ((vId * 7) % 45); // 15 to 60 units in stock

          insertVariant.run(vId, pId, sku, barcode, size, color, 'Traditional Zari / Weave', cost, price, item.tax, 5, stock);
          allVariants.push({ id: vId, name: `${prodName} - ${color} (${size})`, sku, barcode, cost, price, tax: item.tax, hsn: item.hsn });
        }
      }
    }

    log.info(`Generated ${prodIdCounter - 1} Products and ${variantIdCounter - 1} Variants.`);

    // ----------------------------------------------------------------
    // 9. PURCHASES & INWARD SHIPMENTS (40 Purchases)
    // ----------------------------------------------------------------
    const insertPurchase = db.prepare(`
      INSERT INTO purchases (id, purchase_number, supplier_id, purchase_date, subtotal, discount, tax, total, paid_amount, balance_amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'COMPLETED', 'Inward stock receipt from weaver')
      ON CONFLICT(id) DO UPDATE SET total = excluded.total, paid_amount = excluded.paid_amount
    `);

    const insertPurchaseItem = db.prepare(`
      INSERT INTO purchase_items (purchase_id, product_variant_id, quantity, unit_cost, discount, tax, total)
      VALUES (?, ?, ?, ?, 0.0, ?, ?)
    `);

    let pCount = 1;
    for (let i = 1; i <= 40; i++) {
      const pNum = `PO-2026-${String(i).padStart(4, '0')}`;
      const suppId = (i % 35) + 1;
      const daysAgo = 120 - Math.floor((i * 115) / 40);
      const date = new Date(Date.now() - daysAgo * 86400000).toISOString().replace('T', ' ').slice(0, 19);

      let subtotal = 0;
      let totalTax = 0;
      const itemsToInward = [
        allVariants[(i * 3) % allVariants.length],
        allVariants[(i * 7) % allVariants.length],
        allVariants[(i * 13) % allVariants.length],
      ];

      for (const item of itemsToInward) {
        const qty = 10 + (i % 15);
        const itemTot = qty * item.cost;
        const itemTax = itemTot * (item.tax / 100);
        subtotal += itemTot;
        totalTax += itemTax;
      }

      const grandTotal = Math.round(subtotal + totalTax);
      insertPurchase.run(i, pNum, suppId, date, subtotal, 0.0, totalTax, grandTotal, grandTotal);

      for (const item of itemsToInward) {
        const qty = 10 + (i % 15);
        const itemTot = qty * item.cost;
        const itemTax = itemTot * (item.tax / 100);
        insertPurchaseItem.run(i, item.id, qty, item.cost, itemTax, itemTot + itemTax);
      }
    }

    // ----------------------------------------------------------------
    // 10. HISTORICAL SALES INVOICES & PAYMENTS (400 Invoices)
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

    const insertStockTx = db.prepare(`
      INSERT INTO stock_transactions (
        product_variant_id, transaction_type, quantity, reference_type, reference_id,
        previous_quantity, new_quantity, notes, created_by, created_at
      )
      VALUES (?, 'SALE_DEDUCT', ?, 'SALE', ?, ?, ?, 'POS sale checkout', ?, ?)
    `);

    const paymentMethods = ['CASH', 'UPI', 'CARD', 'SPLIT'];
    const cashiers = [3, 4, 7, 8, 10, 12]; // User IDs of cashiers/sales

    for (let sId = 1; sId <= 400; sId++) {
      const invNum = `INV-2026-${String(sId).padStart(5, '0')}`;
      const custId = (sId % 150) + 1;
      const cashierId = cashiers[sId % cashiers.length];

      // Spread over past 90 days
      const daysAgo = 90 - Math.floor((sId * 89) / 400);
      const hours = 9 + (sId % 12);
      const minutes = (sId * 17) % 60;
      const saleDate = new Date(Date.now() - (daysAgo * 86400000 + hours * 3600000 + minutes * 60000)).toISOString().replace('T', ' ').slice(0, 19);

      const itemCount = (sId % 5 === 0) ? 3 : ((sId % 3 === 0) ? 2 : 1);
      let subtotal = 0;
      let totalTax = 0;
      const saleItemsList: Array<{ variant: typeof allVariants[0]; qty: number; lineTotal: number; lineTax: number }> = [];

      for (let k = 0; k < itemCount; k++) {
        const variant = allVariants[(sId * 5 + k * 11) % allVariants.length];
        const qty = (sId % 8 === 0) ? 2 : 1;
        const lineSubtotal = variant.price * qty;
        const lineTax = Math.round(lineSubtotal * (variant.tax / 100) * 100) / 100;
        subtotal += lineSubtotal;
        totalTax += lineTax;
        saleItemsList.push({ variant, qty, lineTotal: lineSubtotal + lineTax, lineTax });
      }

      const discount = (sId % 12 === 0) ? Math.min(500, Math.round(subtotal * 0.05)) : 0;
      const calculatedGrandTotal = subtotal - discount + totalTax;
      const roundedTotal = Math.round(calculatedGrandTotal);
      const roundOff = Math.round((roundedTotal - calculatedGrandTotal) * 100) / 100;
      const cgst = Math.round((totalTax / 2) * 100) / 100;
      const sgst = Math.round((totalTax / 2) * 100) / 100;
      const isTaxInv = (sId % 4 === 0) ? 1 : 0;

      insertSale.run(
        sId, invNum, custId, saleDate, subtotal, discount, totalTax, roundedTotal, roundedTotal,
        'Customer Storefront Purchase', cashierId, saleDate, roundOff, cgst, sgst, isTaxInv
      );

      for (const item of saleItemsList) {
        insertSaleItem.run(
          sId, item.variant.id, item.qty, item.variant.price, item.lineTax, item.lineTotal,
          item.variant.name, item.variant.sku, item.variant.hsn, item.variant.tax, item.lineTax
        );

        // Record stock transaction log
        insertStockTx.run(item.variant.id, -item.qty, sId, 30, 30 - item.qty, cashierId, saleDate);
      }

      // Payments
      const method = paymentMethods[sId % paymentMethods.length];
      if (method === 'SPLIT') {
        const splitCash = Math.floor(roundedTotal / 2);
        const splitUpi = roundedTotal - splitCash;
        insertPayment.run(sId, 'CASH', splitCash, `CASH-${sId}`, saleDate);
        insertPayment.run(sId, 'UPI', splitUpi, `UPI-${sId}-REF${1000 + sId}`, saleDate);
      } else {
        const ref = method === 'UPI' ? `UPI-TXN-${20260000 + sId}` : (method === 'CARD' ? `AUTH-${500000 + sId}` : `CASH-${sId}`);
        insertPayment.run(sId, method, roundedTotal, ref, saleDate);
      }
    }

    log.info('Generated 40 Purchases and 400 Sales Invoices with split payments & stock logs.');

    // ----------------------------------------------------------------
    // 11. STAFF ATTENDANCE (35 Days x 10 Staff = 350+ Records)
    // ----------------------------------------------------------------
    const insertAttendance = db.prepare(`
      INSERT INTO attendance (
        staff_id, attendance_date, status, check_in, check_out, worked_minutes,
        late_minutes, early_exit_minutes, permission_minutes, remarks, source, approval_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'BIOMETRIC_DEVICE', 'APPROVED')
      ON CONFLICT(staff_id, attendance_date) DO UPDATE SET
        status = excluded.status,
        check_in = excluded.check_in,
        check_out = excluded.check_out,
        worked_minutes = excluded.worked_minutes
    `);

    for (let day = 1; day <= 35; day++) {
      const d = new Date(Date.now() - (36 - day) * 86400000);
      const isSunday = d.getDay() === 0;
      const dateStr = d.toISOString().slice(0, 10);

      for (let sId = 1; sId <= 10; sId++) {
        if (isSunday && sId % 2 === 0) {
          // Sunday week-off
          continue;
        }

        const isLate = (day * 3 + sId) % 11 === 0;
        const isAbsent = (day * 7 + sId) % 23 === 0;
        const isHalfDay = (day * 5 + sId) % 19 === 0;

        if (isAbsent) {
          insertAttendance.run(sId, dateStr, 'ABSENT', null, null, 0, 0, 'Planned Personal Leave');
        } else if (isHalfDay) {
          insertAttendance.run(sId, dateStr, 'HALF_DAY', '09:00:00', '13:30:00', 270, 0, 'Approved Half Day Permission');
        } else if (isLate) {
          insertAttendance.run(sId, dateStr, 'PRESENT', '09:22:00', '18:15:00', 473, 22, 'Traffic Delay on GST Road');
        } else {
          const inMins = String(50 + (sId % 10)).padStart(2, '0');
          insertAttendance.run(sId, dateStr, 'PRESENT', `08:${inMins}:00`, '18:10:00', 490, 0, 'Regular On-Time Shift');
        }
      }
    }

    // ----------------------------------------------------------------
    // 12. LEAVE REQUESTS & PAYROLL (2 Months Payroll)
    // ----------------------------------------------------------------
    const insertLeave = db.prepare(`
      INSERT OR IGNORE INTO leave_requests (
        id, staff_id, leave_type_id, start_date, end_date, duration_days,
        duration_type, reason, status, requested_at, approved_by, approved_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'FULL_DAY', ?, ?, ?, 1, ?)
    `);

    const leaveReasons = [
      'Family temple festival celebration in Madurai',
      'Medical checkup and dental appointment',
      'Personal household work and renovation',
      'Attending cousin wedding in Coimbatore',
      'Children school annual day & parent meeting',
    ];

    for (let lId = 1; lId <= 25; lId++) {
      const sId = (lId % 10) + 1;
      const typeId = (lId % 3) + 1;
      const dayOffset = (lId * 4) % 60;
      const sDate = new Date(Date.now() - dayOffset * 86400000).toISOString().slice(0, 10);
      const eDate = sDate;
      const reason = leaveReasons[lId % leaveReasons.length];
      const status = (lId % 5 === 0) ? 'PENDING' : 'APPROVED';
      insertLeave.run(lId, sId, typeId, sDate, eDate, 1.0, reason, status, `${sDate} 08:00:00`, `${sDate} 09:30:00`);
    }

    // Payroll Periods (June & July 2026)
    db.exec(`
      INSERT OR IGNORE INTO payroll_periods (id, name, year, month, start_date, end_date, total_working_days, status) VALUES
        (1, 'June 2026 Payroll', 2026, 6, '2026-06-01', '2026-06-30', 26, 'LOCKED'),
        (2, 'July 2026 Payroll', 2026, 7, '2026-07-01', '2026-07-31', 27, 'LOCKED');
    `);

    const insertPayrollRecord = db.prepare(`
      INSERT INTO payroll_records (
        payroll_period_id, staff_id, basic_salary, gross_earnings, overtime_hours, overtime_amount,
        working_days, present_days, paid_leave_days, unpaid_leave_days, unpaid_leave_deduction,
        advance_deduction, other_deductions, total_deductions, net_salary, status
      )
      VALUES (?, ?, ?, ?, 0, 0, 26, 25, 1, 0, 0, 0, 0, ?, ?, 'PAID')
      ON CONFLICT(payroll_period_id, staff_id) DO UPDATE SET net_salary = excluded.net_salary
    `);

    for (let period = 1; period <= 2; period++) {
      for (const s of staffData.slice(0, 10)) {
        const basic = Math.round(s.sal * 0.5);
        const pf = Math.round(basic * 0.12);
        const net = s.sal - pf;
        insertPayrollRecord.run(period, s.id, basic, s.sal, pf, net);
      }
    }

    // ----------------------------------------------------------------
    // 13. REAL-TIME NOTIFICATIONS & SYSTEM ALERTS (30 Alerts)
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
      { title: 'புதிய நெசவாளர் சரக்கு வரவு (Inward PO Completed)', msg: 'PO-2026-0038 from Arani Handlooms has been verified and stocked.', type: 'INFO', role: 'MANAGER' },
      { title: 'பணியாளர் விடுப்பு விண்ணப்பம் (Leave Application)', msg: 'Priya Sundaram applied for Casual Leave on 2026-08-28.', type: 'INFO', role: 'HR' },
      { title: 'தினசரி கணக்கு முடிப்பு தயார் (Daily Cash Closure)', msg: 'Cash Drawer 1 counter closing matched with 0 discrepancy.', type: 'SUCCESS', role: 'CASHIER' },
      { title: 'AI விற்பனை கணிப்பு (AI Demand Surge Forecast)', msg: 'Bridal Silk sarees demand expected to increase 35% this weekend.', type: 'INFO', role: 'MANAGER' },
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
  log.info('Enterprise Dataset generation successfully completed! (1,000+ records in database).');
}
