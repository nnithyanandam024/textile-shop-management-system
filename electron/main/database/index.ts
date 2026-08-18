import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import log from '../logger';

let dbInstance: Database.Database | null = null;
let currentActiveDbPath: string | null = null;

export function getDatabasePath(): string {
  if (currentActiveDbPath) return currentActiveDbPath;
  const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
  return path.join(userDataPath, 'textile-shop.db');
}

export function getBackupDirectoryPath(): string {
  const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
  const backupPath = path.join(userDataPath, 'Backups');
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  return backupPath;
}

export function initDatabase(customDbPath?: string): Database.Database {
  if (dbInstance && !customDbPath) {
    return dbInstance;
  }

  const dbPath = customDbPath || getDatabasePath();
  currentActiveDbPath = dbPath;
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  log.info(`Initializing SQLite Database at: ${dbPath}`);

  try {
    const instance = new Database(dbPath, { verbose: (msg) => log.debug(`[SQL] ${msg}`) });

    // Enable WAL mode & Foreign Keys
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');

    runMigrations(instance);

    if (!customDbPath) {
      dbInstance = instance;
    }
    log.info('Database initialized and migrated successfully.');
    return instance;
  } catch (error) {
    log.error('Failed to initialize SQLite Database:', error);
    throw error;
  }
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrations = [
    {
      version: 1,
      name: 'core_textile_shop_schema',
      up: (database: Database.Database) => {
        database.exec(`
          -- 1. Roles
          CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 2. Users
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role_id INTEGER NOT NULL,
            is_active INTEGER DEFAULT 1,
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login_at DATETIME,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
          );

          -- 3. Permissions
          CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            module TEXT NOT NULL,
            description TEXT
          );

          -- 4. Role Permissions
          CREATE TABLE IF NOT EXISTS role_permissions (
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
          );

          -- 5. Categories
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            parent_id INTEGER,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
          );

          -- 6. Brands
          CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 7. Products
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category_id INTEGER NOT NULL,
            brand_id INTEGER,
            material TEXT,
            description TEXT,
            image_path TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
            FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
          );

          -- 8. Product Variants
          CREATE TABLE IF NOT EXISTS product_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            sku TEXT NOT NULL UNIQUE,
            barcode TEXT UNIQUE,
            size TEXT,
            color TEXT,
            pattern TEXT,
            purchase_price REAL NOT NULL CHECK (purchase_price >= 0),
            selling_price REAL NOT NULL CHECK (selling_price >= 0),
            tax_rate REAL DEFAULT 0.0 CHECK (tax_rate >= 0),
            minimum_stock INTEGER DEFAULT 5 CHECK (minimum_stock >= 0),
            current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
          );

          -- 9. Customers
          CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            pincode TEXT,
            gst_number TEXT,
            credit_limit REAL DEFAULT 0.0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 10. Suppliers
          CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_code TEXT NOT NULL UNIQUE,
            company_name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            pincode TEXT,
            gst_number TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 11. Purchases
          CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_number TEXT NOT NULL UNIQUE,
            supplier_id INTEGER NOT NULL,
            purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            subtotal REAL NOT NULL DEFAULT 0.0,
            discount REAL DEFAULT 0.0,
            tax REAL DEFAULT 0.0,
            total REAL NOT NULL DEFAULT 0.0,
            paid_amount REAL DEFAULT 0.0,
            balance_amount REAL DEFAULT 0.0,
            status TEXT DEFAULT 'COMPLETED',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
          );

          -- 12. Purchase Items
          CREATE TABLE IF NOT EXISTS purchase_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_id INTEGER NOT NULL,
            product_variant_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
            discount REAL DEFAULT 0.0,
            tax REAL DEFAULT 0.0,
            total REAL NOT NULL CHECK (total >= 0),
            FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
            FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
          );

          -- 13. Sales
          CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT NOT NULL UNIQUE,
            customer_id INTEGER NOT NULL,
            sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            subtotal REAL NOT NULL DEFAULT 0.0,
            discount REAL DEFAULT 0.0,
            tax REAL DEFAULT 0.0,
            total REAL NOT NULL DEFAULT 0.0,
            paid_amount REAL DEFAULT 0.0,
            balance_amount REAL DEFAULT 0.0,
            status TEXT DEFAULT 'COMPLETED',
            notes TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
          );

          -- 14. Sale Items
          CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_variant_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price REAL NOT NULL CHECK (unit_price >= 0),
            discount REAL DEFAULT 0.0,
            tax REAL DEFAULT 0.0,
            total REAL NOT NULL CHECK (total >= 0),
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
          );

          -- 15. Payments
          CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            payment_method TEXT NOT NULL,
            amount REAL NOT NULL CHECK (amount >= 0),
            reference_number TEXT,
            payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
          );

          -- 16. Returns
          CREATE TABLE IF NOT EXISTS returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_number TEXT NOT NULL UNIQUE,
            sale_id INTEGER NOT NULL,
            customer_id INTEGER NOT NULL,
            return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            return_type TEXT NOT NULL,
            refund_amount REAL DEFAULT 0.0,
            status TEXT DEFAULT 'COMPLETED',
            reason TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
          );

          -- 17. Return Items
          CREATE TABLE IF NOT EXISTS return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            sale_item_id INTEGER NOT NULL,
            product_variant_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            refund_amount REAL DEFAULT 0.0,
            condition TEXT DEFAULT 'GOOD',
            reason TEXT,
            FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
            FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE RESTRICT,
            FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
          );

          -- 18. Stock Transactions
          CREATE TABLE IF NOT EXISTS stock_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_variant_id INTEGER NOT NULL,
            transaction_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            reference_type TEXT,
            reference_id INTEGER,
            previous_quantity INTEGER NOT NULL,
            new_quantity INTEGER NOT NULL,
            notes TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
          );

          -- 19. Expenses
          CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            description TEXT,
            amount REAL NOT NULL CHECK (amount >= 0),
            payment_method TEXT DEFAULT 'CASH',
            expense_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
          );

          -- 20. Settings
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 21. Audit Logs
          CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            old_value TEXT,
            new_value TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_or_device TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          );

          -- INDEXES
          CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
          CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
          CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
          CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
          CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_variants(barcode);
          CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
          CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
          CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
          CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
          CREATE INDEX IF NOT EXISTS idx_stock_tx_variant ON stock_transactions(product_variant_id);
          CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
          CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
        `);
      }
    },
    {
      version: 2,
      name: 'auth_and_rbac_permissions',
      up: (database: Database.Database) => {
        database.exec(`
          -- Seed Permissions Table
          INSERT OR IGNORE INTO permissions (id, code, module, description) VALUES
            (1, 'dashboard.view', 'Dashboard', 'View dashboard metrics'),
            (2, 'products.view', 'Products', 'View products and variants'),
            (3, 'products.manage', 'Products', 'Create, update, and delete products'),
            (4, 'inventory.view', 'Inventory', 'View stock levels'),
            (5, 'inventory.adjust', 'Inventory', 'Adjust stock quantities'),
            (6, 'billing.create', 'Billing', 'Create POS sale transactions'),
            (7, 'sales.view', 'Sales', 'View sales transaction history'),
            (8, 'sales.cancel', 'Sales', 'Cancel or void sales transactions'),
            (9, 'customers.view', 'Customers', 'View customer directory'),
            (10, 'customers.manage', 'Customers', 'Create and update customer details'),
            (11, 'suppliers.view', 'Suppliers', 'View supplier registry'),
            (12, 'suppliers.manage', 'Suppliers', 'Create and update supplier details'),
            (13, 'purchases.view', 'Purchases', 'View purchase orders'),
            (14, 'purchases.manage', 'Purchases', 'Create and inward purchase orders'),
            (15, 'returns.create', 'Returns', 'Process customer returns and exchanges'),
            (16, 'reports.view', 'Reports', 'Access business analytics and reports'),
            (17, 'reports.export', 'Reports', 'Export reporting data'),
            (18, 'users.view', 'Users', 'View user account list'),
            (19, 'users.manage', 'Users', 'Create, update, deactivate users and reset passwords'),
            (20, 'settings.view', 'Settings', 'View system settings'),
            (21, 'settings.update', 'Settings', 'Modify system settings'),
            (22, 'backup.create', 'Backup', 'Generate database backups'),
            (23, 'backup.restore', 'Backup', 'Restore database from backup file');

          -- Ensure Default Roles exist
          INSERT OR IGNORE INTO roles (id, name, description) VALUES
            (1, 'Owner', 'Full system access and store administrative privileges'),
            (2, 'Manager', 'Access to sales, inventory, purchases, and reporting'),
            (3, 'Cashier', 'Access to POS billing terminal and customer registry'),
            (4, 'Inventory Staff', 'Access to stock movements and product management');

          -- Clear and Map Role Permissions
          DELETE FROM role_permissions;

          -- Role 1: Owner (All Permissions 1..23)
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT 1, id FROM permissions;

          -- Role 2: Manager (Permissions 1..17, 20)
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT 2, id FROM permissions WHERE code NOT IN (
            'users.view', 'users.manage', 'settings.update', 'backup.create', 'backup.restore'
          );

          -- Role 3: Cashier (Dashboard, Products View, Billing, Sales View, Customers Manage, Returns Create)
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT 3, id FROM permissions WHERE code IN (
            'dashboard.view', 'products.view', 'inventory.view', 'billing.create', 'sales.view',
            'customers.view', 'customers.manage', 'returns.create'
          );

          -- Role 4: Inventory Staff (Dashboard, Products Manage, Inventory Manage, Suppliers Manage, Purchases Manage)
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT 4, id FROM permissions WHERE code IN (
            'dashboard.view', 'products.view', 'products.manage', 'inventory.view', 'inventory.adjust',
            'customers.view', 'suppliers.view', 'suppliers.manage', 'purchases.view', 'purchases.manage'
          );
        `);
      }
    },
    {
      version: 3,
      name: 'staff_module_foundation',
      up: (database: Database.Database) => {
        database.exec(`
          -- 1. Departments
          CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department_code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 2. Designations
          CREATE TABLE IF NOT EXISTS designations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            designation_code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            department_id INTEGER NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
          );

          -- 3. Staff
          CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_code TEXT NOT NULL UNIQUE,
            first_name TEXT NOT NULL,
            last_name TEXT,
            phone TEXT NOT NULL,
            email TEXT,
            address TEXT,
            joining_date TEXT NOT NULL,
            department_id INTEGER NOT NULL,
            designation_id INTEGER NOT NULL,
            employment_type TEXT NOT NULL DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'TEMPORARY', 'CONTRACT', 'INTERN')),
            status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED')),
            photo_path TEXT,
            user_id INTEGER UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
            FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE RESTRICT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          );

          -- Add permissions for Staff Management
          INSERT OR IGNORE INTO permissions (code, module, description) VALUES
            ('staff.view', 'Staff', 'View staff directory and profiles'),
            ('staff.manage', 'Staff', 'Create, edit, and deactivate staff records'),
            ('staff.organization', 'Staff', 'Manage departments and designations');

          -- Map permissions to Owner (Role 1) and Manager (Role 2)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 1, id FROM permissions WHERE module = 'Staff';

          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 2, id FROM permissions WHERE module = 'Staff';

          -- Seed Default Departments if empty
          INSERT INTO departments (department_code, name, description)
          SELECT 'DEP-001', 'Sales', 'Sales & Storefront operations' WHERE NOT EXISTS (SELECT 1 FROM departments);

          INSERT INTO departments (department_code, name, description)
          SELECT 'DEP-002', 'Inventory', 'Stock & warehouse management' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'DEP-002');

          INSERT INTO departments (department_code, name, description)
          SELECT 'DEP-003', 'Purchase', 'Supplier procurement & receiving' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'DEP-003');

          INSERT INTO departments (department_code, name, description)
          SELECT 'DEP-004', 'Accounts', 'Financial accounting & billing' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'DEP-004');

          INSERT INTO departments (department_code, name, description)
          SELECT 'DEP-005', 'Management', 'Executive management & oversight' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'DEP-005');

          INSERT INTO departments (department_code, name, description)
          SELECT 'DEP-006', 'Administration', 'General store administration' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'DEP-006');

          -- Seed Default Designations if empty
          INSERT INTO designations (designation_code, name, department_id, description)
          SELECT 'DES-001', 'Sales Executive', (SELECT id FROM departments WHERE name = 'Sales'), 'Frontline sales'
          WHERE NOT EXISTS (SELECT 1 FROM designations WHERE designation_code = 'DES-001');

          INSERT INTO designations (designation_code, name, department_id, description)
          SELECT 'DES-002', 'Senior Sales Executive', (SELECT id FROM departments WHERE name = 'Sales'), 'Senior sales staff'
          WHERE NOT EXISTS (SELECT 1 FROM designations WHERE designation_code = 'DES-002');

          INSERT INTO designations (designation_code, name, department_id, description)
          SELECT 'DES-003', 'Inventory Assistant', (SELECT id FROM departments WHERE name = 'Inventory'), 'Stock handler'
          WHERE NOT EXISTS (SELECT 1 FROM designations WHERE designation_code = 'DES-003');

          INSERT INTO designations (designation_code, name, department_id, description)
          SELECT 'DES-004', 'Inventory Manager', (SELECT id FROM departments WHERE name = 'Inventory'), 'Head of inventory'
          WHERE NOT EXISTS (SELECT 1 FROM designations WHERE designation_code = 'DES-004');

          INSERT INTO designations (designation_code, name, department_id, description)
          SELECT 'DES-005', 'Accountant', (SELECT id FROM departments WHERE name = 'Accounts'), 'Bookkeeper & billing accountant'
          WHERE NOT EXISTS (SELECT 1 FROM designations WHERE designation_code = 'DES-005');

          INSERT INTO designations (designation_code, name, department_id, description)
          SELECT 'DES-006', 'Store Manager', (SELECT id FROM departments WHERE name = 'Management'), 'Overall store operations manager'
          WHERE NOT EXISTS (SELECT 1 FROM designations WHERE designation_code = 'DES-006');
        `);
      }
    },
    {
      version: 4.0,
      name: 'staff_module_profiles_and_details',
      up: (db: Database.Database) => {
        db.exec(`
          -- Expand staff table with Phase 2 Profile & Employment columns
          ALTER TABLE staff ADD COLUMN date_of_birth TEXT;
          ALTER TABLE staff ADD COLUMN gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say'));
          ALTER TABLE staff ADD COLUMN alternate_phone TEXT;
          ALTER TABLE staff ADD COLUMN address_line_1 TEXT;
          ALTER TABLE staff ADD COLUMN address_line_2 TEXT;
          ALTER TABLE staff ADD COLUMN city TEXT;
          ALTER TABLE staff ADD COLUMN district TEXT;
          ALTER TABLE staff ADD COLUMN state TEXT;
          ALTER TABLE staff ADD COLUMN pincode TEXT;
          ALTER TABLE staff ADD COLUMN manager_id INTEGER REFERENCES staff(id) ON DELETE SET NULL;
          ALTER TABLE staff ADD COLUMN work_location TEXT DEFAULT 'Main Store';
          ALTER TABLE staff ADD COLUMN confirmation_date TEXT;
          ALTER TABLE staff ADD COLUMN exit_date TEXT;

          -- Staff Emergency Contacts Table
          CREATE TABLE IF NOT EXISTS staff_emergency_contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            relationship TEXT NOT NULL,
            phone TEXT NOT NULL,
            alternate_phone TEXT,
            address TEXT,
            is_primary INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );

          -- Staff Bank & Payroll Details Table
          CREATE TABLE IF NOT EXISTS staff_bank_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL UNIQUE,
            bank_name TEXT NOT NULL,
            account_holder_name TEXT NOT NULL,
            account_number_encrypted TEXT NOT NULL,
            ifsc TEXT NOT NULL,
            payment_method TEXT DEFAULT 'Bank Transfer' CHECK (payment_method IN ('Bank Transfer', 'Cash', 'Cheque', 'Other')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );

          -- Staff Documents Table
          CREATE TABLE IF NOT EXISTS staff_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL,
            document_type TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            verification_status TEXT DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
            uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            verified_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );

          -- Staff Notes Table
          CREATE TABLE IF NOT EXISTS staff_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL,
            note TEXT NOT NULL,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );

          -- Staff Employment History Table
          CREATE TABLE IF NOT EXISTS staff_employment_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL,
            department_id INTEGER NOT NULL,
            designation_id INTEGER NOT NULL,
            manager_id INTEGER,
            employment_type TEXT NOT NULL,
            effective_from TEXT NOT NULL,
            effective_to TEXT,
            reason TEXT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
            FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE RESTRICT,
            FOREIGN KEY (manager_id) REFERENCES staff(id) ON DELETE SET NULL
          );

          -- Add permissions for Staff Phase 2
          INSERT OR IGNORE INTO permissions (code, module, description) VALUES
            ('staff.documents.view', 'Staff', 'View staff uploaded documents'),
            ('staff.documents.manage', 'Staff', 'Upload, verify, and delete staff documents'),
            ('staff.bank.view', 'Staff', 'View sensitive bank and payroll account setup'),
            ('staff.bank.manage', 'Staff', 'Edit staff bank account setup'),
            ('staff.notes.view', 'Staff', 'View internal staff notes'),
            ('staff.notes.manage', 'Staff', 'Create and edit internal staff notes'),
            ('staff.history.view', 'Staff', 'View staff employment history timeline');

          -- Map permissions to Owner (Role 1) and Manager (Role 2)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 1, id FROM permissions WHERE module = 'Staff';

          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 2, id FROM permissions WHERE module = 'Staff';
        `);
      }
    },
    {
      version: 5,
      name: 'staff_module_rbac_and_access_control',
      up: (database: Database.Database) => {
        // Safe column additions to roles table
        try { database.exec("ALTER TABLE roles ADD COLUMN is_system_role INTEGER DEFAULT 0;"); } catch {}
        try { database.exec("ALTER TABLE roles ADD COLUMN status TEXT DEFAULT 'ACTIVE';"); } catch {}
        try { database.exec("ALTER TABLE roles ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;"); } catch {}

        database.exec(`
          -- Seed / Ensure System Roles
          INSERT OR IGNORE INTO roles (id, name, description, is_system_role, status) VALUES
            (1, 'Owner', 'Full system access and administrative privileges', 1, 'ACTIVE'),
            (2, 'Manager', 'Access to sales, inventory, purchases, reporting, staff view', 1, 'ACTIVE'),
            (3, 'Cashier', 'Access to POS billing terminal and customer registry', 1, 'ACTIVE'),
            (4, 'Inventory Staff', 'Access to stock movements and product management', 1, 'ACTIVE'),
            (5, 'Accountant', 'Access to financial reports, expenses, payables, staff bank details', 1, 'ACTIVE'),
            (6, 'HR Staff', 'Access to staff master, documents, attendance, leave, performance', 1, 'ACTIVE');

          UPDATE roles SET is_system_role = 1 WHERE id IN (1, 2, 3, 4, 5, 6);

          -- Seed Granular Permissions
          INSERT OR IGNORE INTO permissions (code, module, description) VALUES
            ('staff.export', 'Staff', 'Export staff list and data'),
            ('staff.print', 'Staff', 'Print staff profile documents'),
            ('staff.bank.update', 'Staff', 'Update sensitive staff bank setup'),
            ('staff.employment.view', 'Staff', 'View staff employment details'),
            ('staff.employment.update', 'Staff', 'Update staff employment details'),
            ('staff.employment.history.create', 'Staff', 'Record staff employment history changes'),
            ('user.view', 'Users', 'View user accounts'),
            ('user.create', 'Users', 'Create new login user account for staff'),
            ('user.update', 'Users', 'Update user display name and status'),
            ('user.disable', 'Users', 'Disable or lock user login access'),
            ('user.reset_password', 'Users', 'Reset user account password'),
            ('role.view', 'Roles', 'View roles and permission matrices'),
            ('role.create', 'Roles', 'Create custom roles'),
            ('role.update', 'Roles', 'Edit role name, description, and permissions'),
            ('role.delete', 'Roles', 'Delete custom roles'),
            ('role.assign', 'Roles', 'Assign roles to staff user accounts'),
            ('pos.view', 'POS', 'View POS terminal interface'),
            ('pos.create', 'POS', 'Create POS checkout sales'),
            ('inventory.manage', 'Inventory', 'Manage stock inward and adjustments'),
            ('customers.manage', 'Customers', 'Create and edit customer records'),
            ('suppliers.manage', 'Suppliers', 'Create and edit supplier records'),
            ('purchases.view', 'Purchases', 'View purchase records'),
            ('purchases.manage', 'Purchases', 'Create purchase orders'),
            ('returns.view', 'Returns', 'View return and exchange history'),
            ('returns.create', 'Returns', 'Process customer returns and exchanges'),
            ('expenses.view', 'Expenses', 'View business expense entries'),
            ('expenses.manage', 'Expenses', 'Create and manage expense entries'),
            ('settings.manage', 'Settings', 'Update system settings');

          -- Map Role Permissions for System Roles
          -- 1. Owner (Role 1): All Permissions
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 1, id FROM permissions;

          -- 2. Manager (Role 2)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 2, id FROM permissions WHERE code NOT IN (
            'role.create', 'role.update', 'role.delete', 'user.reset_password', 'settings.manage', 'backup.restore'
          );

          -- 3. Cashier (Role 3)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 3, id FROM permissions WHERE code IN (
            'dashboard.view', 'pos.view', 'pos.create', 'billing.create', 'sales.view',
            'customers.view', 'customers.manage', 'products.view', 'inventory.view', 'returns.create', 'staff.view'
          );

          -- 4. Inventory Staff (Role 4)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 4, id FROM permissions WHERE code IN (
            'dashboard.view', 'products.view', 'products.manage', 'inventory.view', 'inventory.manage',
            'purchases.view', 'purchases.manage', 'suppliers.view', 'suppliers.manage'
          );

          -- 5. Accountant (Role 5)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 5, id FROM permissions WHERE code IN (
            'dashboard.view', 'reports.view', 'reports.export', 'sales.view', 'purchases.view',
            'expenses.view', 'expenses.manage', 'customers.view', 'suppliers.view',
            'staff.bank.view', 'staff.bank.update', 'staff.view'
          );

          -- 6. HR Staff (Role 6)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 6, id FROM permissions WHERE module IN ('Staff', 'Users') AND code NOT IN ('user.reset_password');
        `);
      }
    },
    {
      version: 6,
      name: 'staff_module_attendance_system',
      up: (database: Database.Database) => {
        database.exec(`
          -- Attendance Settings Table
          CREATE TABLE IF NOT EXISTS attendance_settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            work_start_time TEXT DEFAULT '09:00',
            work_end_time TEXT DEFAULT '18:00',
            grace_minutes INTEGER DEFAULT 10,
            full_day_minutes INTEGER DEFAULT 480,
            half_day_minutes INTEGER DEFAULT 240,
            allow_manual_entry INTEGER DEFAULT 1,
            require_approval_for_correction INTEGER DEFAULT 1,
            updated_by INTEGER,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          INSERT OR IGNORE INTO attendance_settings (id, work_start_time, work_end_time, grace_minutes, full_day_minutes, half_day_minutes)
          VALUES (1, '09:00', '18:00', 10, 480, 240);

          -- Attendance Core Table
          CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
            attendance_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PRESENT',
            check_in TEXT,
            check_out TEXT,
            worked_minutes INTEGER DEFAULT 0,
            late_minutes INTEGER DEFAULT 0,
            early_exit_minutes INTEGER DEFAULT 0,
            permission_minutes INTEGER DEFAULT 0,
            remarks TEXT,
            source TEXT DEFAULT 'SELF_CHECK_IN',
            approval_status TEXT DEFAULT 'NOT_REQUIRED',
            is_locked INTEGER DEFAULT 0,
            created_by INTEGER,
            approved_by INTEGER,
            approved_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(staff_id, attendance_date)
          );

          CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);
          CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
          CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
          CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, attendance_date);

          -- Attendance Corrections & Audit Trail
          CREATE TABLE IF NOT EXISTS attendance_corrections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attendance_id INTEGER NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
            original_check_in TEXT,
            original_check_out TEXT,
            original_status TEXT,
            new_check_in TEXT,
            new_check_out TEXT,
            new_status TEXT,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            requested_by INTEGER NOT NULL,
            reviewed_by INTEGER,
            reviewed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Seed Attendance Permissions
          INSERT OR IGNORE INTO permissions (code, module, description) VALUES
            ('attendance.view', 'Attendance', 'View attendance dashboard and daily records'),
            ('attendance.create', 'Attendance', 'Perform daily check-in and check-out'),
            ('attendance.update', 'Attendance', 'Mark manual attendance entries'),
            ('attendance.correct', 'Attendance', 'Request attendance corrections'),
            ('attendance.approve', 'Attendance', 'Approve or reject attendance corrections'),
            ('attendance.export', 'Attendance', 'Export attendance reports and summaries'),
            ('attendance.manage_settings', 'Attendance', 'Configure work timing and grace period settings');

          -- Map Attendance Permissions to System Roles
          -- 1. Owner (Role 1)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 1, id FROM permissions WHERE module = 'Attendance';

          -- 2. Manager (Role 2)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 2, id FROM permissions WHERE module = 'Attendance';

          -- 3. Cashier (Role 3)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 3, id FROM permissions WHERE code IN ('attendance.view', 'attendance.create');

          -- 6. HR Staff (Role 6)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 6, id FROM permissions WHERE module = 'Attendance';
        `);
      }
    },
    {
      version: 7,
      name: 'staff_module_shift_system',
      up: (database: Database.Database) => {
        database.exec(`
          -- 1. Shift Templates Table
          CREATE TABLE IF NOT EXISTS shift_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shift_code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            grace_minutes INTEGER DEFAULT 10,
            break_minutes INTEGER DEFAULT 60,
            minimum_work_minutes INTEGER DEFAULT 480,
            is_overnight INTEGER DEFAULT 0,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 2. Staff Shift Assignments Table (Long term assignments)
          CREATE TABLE IF NOT EXISTS staff_shift_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
            shift_template_id INTEGER NOT NULL REFERENCES shift_templates(id),
            effective_from TEXT NOT NULL,
            effective_to TEXT,
            reason TEXT,
            assigned_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 3. Staff Schedule Days Table (Mon-Sun weekly day configuration)
          CREATE TABLE IF NOT EXISTS staff_schedule_days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
            day_of_week INTEGER NOT NULL,
            shift_template_id INTEGER REFERENCES shift_templates(id),
            is_week_off INTEGER DEFAULT 0,
            effective_from TEXT NOT NULL,
            effective_to TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 4. Staff Shift Overrides Table (Single-day temporary changes)
          CREATE TABLE IF NOT EXISTS staff_shift_overrides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
            override_date TEXT NOT NULL,
            shift_template_id INTEGER REFERENCES shift_templates(id),
            is_week_off INTEGER DEFAULT 0,
            reason TEXT NOT NULL,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(staff_id, override_date)
          );

          -- Indexes for fast shift resolution queries
          CREATE INDEX IF NOT EXISTS idx_staff_shift_assignments_staff ON staff_shift_assignments(staff_id, effective_from);
          CREATE INDEX IF NOT EXISTS idx_staff_schedule_days_staff ON staff_schedule_days(staff_id, day_of_week);
          CREATE INDEX IF NOT EXISTS idx_staff_shift_overrides_staff ON staff_shift_overrides(staff_id, override_date);

          -- Add shift snapshot & overtime columns to attendance table
          ALTER TABLE attendance ADD COLUMN shift_template_id INTEGER REFERENCES shift_templates(id);
          ALTER TABLE attendance ADD COLUMN scheduled_start TEXT;
          ALTER TABLE attendance ADD COLUMN scheduled_end TEXT;
          ALTER TABLE attendance ADD COLUMN scheduled_minutes INTEGER DEFAULT 480;
          ALTER TABLE attendance ADD COLUMN overtime_minutes INTEGER DEFAULT 0;
          ALTER TABLE attendance ADD COLUMN overtime_status TEXT DEFAULT 'NOT_APPLICABLE';

          -- Seed Default Shift Templates
          INSERT OR IGNORE INTO shift_templates (shift_code, name, start_time, end_time, grace_minutes, break_minutes, minimum_work_minutes, is_overnight, status) VALUES
            ('SFT-001', 'Morning Shift', '08:00', '16:00', 10, 60, 420, 0, 'ACTIVE'),
            ('SFT-002', 'General Shift', '09:00', '18:00', 10, 60, 480, 0, 'ACTIVE'),
            ('SFT-003', 'Evening Shift', '13:00', '21:00', 10, 60, 420, 0, 'ACTIVE');

          -- Seed Shift Permissions
          INSERT OR IGNORE INTO permissions (code, module, description) VALUES
            ('shift.view', 'Shifts', 'View shift templates, rosters and staff schedules'),
            ('shift.create', 'Shifts', 'Create new shift templates'),
            ('shift.update', 'Shifts', 'Edit existing shift templates'),
            ('shift.deactivate', 'Shifts', 'Deactivate shift templates'),
            ('shift.assign', 'Shifts', 'Assign shifts to staff members'),
            ('shift.override', 'Shifts', 'Create single-day temporary shift overrides'),
            ('shift.approve', 'Shifts', 'Approve or reject overtime and schedule changes'),
            ('shift.export', 'Shifts', 'Export shift schedules and reports'),
            ('shift.manage_settings', 'Shifts', 'Manage default shift configurations');

          -- Map Shift Permissions to System Roles
          -- 1. Owner (Role 1)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 1, id FROM permissions WHERE module = 'Shifts';

          -- 2. Manager (Role 2)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 2, id FROM permissions WHERE module = 'Shifts';

          -- 3. Cashier (Role 3)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 3, id FROM permissions WHERE code IN ('shift.view');

          -- 6. HR Staff (Role 6)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 6, id FROM permissions WHERE module = 'Shifts';
        `);
      }
    },
    {
      version: 8,
      name: 'staff_module_leave_system',
      up: (database: Database.Database) => {
        database.exec(`
          -- 1. Leave Types Table
          CREATE TABLE IF NOT EXISTS leave_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            leave_code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            description TEXT,
            paid INTEGER DEFAULT 1,
            requires_approval INTEGER DEFAULT 1,
            requires_document INTEGER DEFAULT 0,
            annual_allocation INTEGER DEFAULT 12,
            carry_forward_allowed INTEGER DEFAULT 0,
            max_carry_forward INTEGER DEFAULT 0,
            max_consecutive_days INTEGER DEFAULT 5,
            status TEXT DEFAULT 'ACTIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 2. Leave Balances Table
          CREATE TABLE IF NOT EXISTS leave_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
            leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
            year INTEGER NOT NULL,
            allocated_days REAL DEFAULT 0,
            carry_forward_days REAL DEFAULT 0,
            used_days REAL DEFAULT 0,
            adjustment_days REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(staff_id, leave_type_id, year)
          );

          -- 3. Leave Requests Table
          CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
            leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            duration_days REAL NOT NULL,
            duration_type TEXT DEFAULT 'FULL_DAY',
            session TEXT,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            attachment_path TEXT,
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            approved_by INTEGER,
            approved_at DATETIME,
            rejection_reason TEXT,
            cancelled_by INTEGER,
            cancelled_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 4. Holidays Table
          CREATE TABLE IF NOT EXISTS holidays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            holiday_date TEXT NOT NULL UNIQUE,
            type TEXT DEFAULT 'PUBLIC',
            description TEXT,
            status TEXT DEFAULT 'ACTIVE',
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- 5. Leave Balance Adjustments Table
          CREATE TABLE IF NOT EXISTS leave_balance_adjustments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
            leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
            year INTEGER NOT NULL,
            adjustment_days REAL NOT NULL,
            reason TEXT NOT NULL,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Add leave_request_id column to attendance table
          ALTER TABLE attendance ADD COLUMN leave_request_id INTEGER REFERENCES leave_requests(id);

          -- Seed Default Leave Types
          INSERT OR IGNORE INTO leave_types (leave_code, name, description, paid, annual_allocation, carry_forward_allowed, max_carry_forward, max_consecutive_days, status) VALUES
            ('CL', 'Casual Leave', 'Casual personal time off', 1, 12, 0, 0, 3, 'ACTIVE'),
            ('SL', 'Sick Leave', 'Medical or health related leave', 1, 10, 0, 0, 5, 'ACTIVE'),
            ('EL', 'Earned Leave', 'Earned annual paid leave', 1, 15, 1, 5, 10, 'ACTIVE'),
            ('UL', 'Unpaid Leave', 'Loss of pay leave without fixed quota', 0, 0, 0, 0, 30, 'ACTIVE');

          -- Seed 2026 Sample Holidays
          INSERT OR IGNORE INTO holidays (name, holiday_date, type, description) VALUES
            ('Republic Day', '2026-01-26', 'PUBLIC', 'National Holiday'),
            ('Independence Day', '2026-08-15', 'PUBLIC', 'National Holiday'),
            ('Gandhi Jayanti', '2026-10-02', 'PUBLIC', 'National Holiday'),
            ('Diwali', '2026-11-01', 'SHOP', 'Festival Celebration'),
            ('Christmas', '2026-12-25', 'PUBLIC', 'Festival Celebration');

          -- Seed Leave Permissions
          INSERT OR IGNORE INTO permissions (code, module, description) VALUES
            ('leave.view', 'Leave', 'View leave requests, balances and calendars'),
            ('leave.create', 'Leave', 'Submit leave applications'),
            ('leave.update', 'Leave', 'Edit pending leave requests'),
            ('leave.approve', 'Leave', 'Approve pending leave requests'),
            ('leave.reject', 'Leave', 'Reject pending leave requests'),
            ('leave.cancel', 'Leave', 'Cancel approved leave requests'),
            ('leave.withdraw', 'Leave', 'Withdraw pending leave requests'),
            ('leave.export', 'Leave', 'Export leave reports and summaries'),
            ('leave.manage_types', 'Leave', 'Create and configure leave types'),
            ('leave.manage_balances', 'Leave', 'Adjust employee leave balances'),
            ('leave.manage_holidays', 'Leave', 'Manage shop holiday calendar');

          -- Map Leave Permissions to System Roles
          -- 1. Owner (Role 1)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 1, id FROM permissions WHERE module = 'Leave';

          -- 2. Manager (Role 2)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 2, id FROM permissions WHERE module = 'Leave';

          -- 3. Cashier (Role 3)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 3, id FROM permissions WHERE code IN ('leave.view', 'leave.create', 'leave.withdraw');

          -- 6. HR Staff (Role 6)
          INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT 6, id FROM permissions WHERE module = 'Leave';
        `);
      }
    }
  ];

  const row = db.prepare('SELECT MAX(version) as max_version FROM schema_migrations').get() as { max_version: number | null };
  const currentVersion = row?.max_version || 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      log.info(`Executing DB Migration v${migration.version}: ${migration.name}`);
      const transaction = db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
      });
      transaction();
      log.info(`Migration v${migration.version} completed.`);
    }
  }
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    log.info('Closing SQLite Database...');
    dbInstance.close();
    dbInstance = null;
    currentActiveDbPath = null;
  }
}
