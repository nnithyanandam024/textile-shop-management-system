import Database from 'better-sqlite3';
import log from '../logger';

export function seedDatabase(db: Database.Database) {
  log.info('Running database seed script...');

  const transaction = db.transaction(() => {
    // 1. Seed Roles
    db.exec(`
      INSERT OR IGNORE INTO roles (id, name, description) VALUES
        (1, 'Owner', 'Full system access and store administrative privileges'),
        (2, 'Manager', 'Access to sales, inventory, purchases, and reporting'),
        (3, 'Cashier', 'Access to POS billing terminal and customer registry'),
        (4, 'Inventory Staff', 'Access to stock movements and product management');
    `);

    // 2. Seed Admin User
    db.exec(`
      INSERT OR IGNORE INTO users (id, username, password_hash, display_name, role_id) VALUES
        (1, 'admin', 'admin123', 'Store Administrator', 1);
    `);

    // 3. Seed Default Categories
    db.exec(`
      INSERT OR IGNORE INTO categories (id, name, description, parent_id) VALUES
        (1, 'Men''s Wear', 'Clothing and fabrics for men', NULL),
        (2, 'Women''s Wear', 'Sarees, kurtis, dresses and traditional wear', NULL),
        (3, 'Kids Wear', 'Children and infant apparel', NULL),
        (4, 'Accessories', 'Belts, ties, handkerchiefs and fittings', NULL),
        (5, 'Shirts', 'Formal and casual shirts for men', 1),
        (6, 'Sarees', 'Silk, cotton, and designer sarees', 2);
    `);

    // 4. Seed Default Brands
    db.exec(`
      INSERT OR IGNORE INTO brands (id, name, description) VALUES
        (1, 'Raymond', 'Premium suiting and shirting brand'),
        (2, 'Levis', 'Quality denim jeans and casual wear'),
        (3, 'Peter England', 'Formal business wear'),
        (4, 'Allen Solly', 'Casual and semi-formal clothing');
    `);

    // 5. Seed Default Customer (Walk-in)
    db.exec(`
      INSERT OR IGNORE INTO customers (id, customer_code, name, phone, address) VALUES
        (1, 'CUST-0000', 'Walk-in Customer', '0000000000', 'Counter Sale');
    `);

    // 6. Seed Default Supplier
    db.exec(`
      INSERT OR IGNORE INTO suppliers (id, supplier_code, company_name, contact_person, phone) VALUES
        (1, 'SUPP-0001', 'Textile Wholesale Hub', 'Rajesh Kumar', '+91 98765 00001');
    `);

    // 7. Seed Sample Product & Variants
    db.exec(`
      INSERT OR IGNORE INTO products (id, name, category_id, brand_id, material, description) VALUES
        (1, 'Premium Cotton Shirt', 5, 1, 'Cotton', 'Men formal cotton shirt'),
        (2, 'Silk Saree Traditional', 6, 1, 'Silk', 'Kanchipuram traditional silk saree');

      INSERT OR IGNORE INTO product_variants (id, product_id, sku, barcode, size, color, purchase_price, selling_price, minimum_stock, current_stock) VALUES
        (1, 1, 'TX-PCS-001', '89010001001', 'M', 'Blue', 600.0, 999.0, 5, 15),
        (2, 1, 'TX-PCS-002', '89010001002', 'L', 'Blue', 600.0, 999.0, 5, 12),
        (3, 2, 'TX-SLK-001', '89010002001', 'Free Size', 'Gold', 2500.0, 4500.0, 3, 8);
    `);

    // 8. Seed Default Settings
    db.exec(`
      INSERT OR IGNORE INTO settings (key, value) VALUES
        ('shop_name', 'Textile Fashion Store'),
        ('shop_address', '123 Main Bazaar Road, Textile City'),
        ('shop_phone', '+91 98765 43210'),
        ('gst_number', '33AAAAA0000A1Z5'),
        ('currency', 'INR'),
        ('invoice_prefix', 'INV-'),
        ('default_tax_rate', '5.0'),
        ('low_stock_threshold', '5');
    `);
  });

  transaction();
  log.info('Database seed completed successfully.');
}
