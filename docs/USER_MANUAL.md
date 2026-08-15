# Textile Shop Management System — User & Deployment Manual 📖

Welcome to the **Textile Shop Management System**, a modern, offline-first Windows desktop Point-of-Sale (POS) and Enterprise Resource Planning (ERP) application designed specifically for textile retailers, fabric showrooms, saree shops, and garment outlets.

---

## 🚀 1. Installation & First-Time Setup

### System Requirements:
- **Operating System**: Windows 10 / Windows 11 (64-bit)
- **RAM**: 4 GB minimum (8 GB recommended)
- **Storage**: 500 MB for application, plus storage for database backups and invoices.
- **Hardware**: Compatible with standard USB Barcode Scanners, Thermal Receipt Printers (80mm/58mm), and A4 Printers.

### First-Time Installation:
1. Double-click `TextileShopSetup-1.0.0.exe` to launch the Windows Installer.
2. Select your preferred installation directory or accept default (`C:\Program Files\Textile Shop Management System`).
3. Click **Install**. Desktop and Start Menu shortcuts will be generated automatically.
4. Launch **Textile Shop Management System**.
5. On initial launch, the **First-Run Setup Wizard** will guide you through:
   - Entering Store Profile details (Store Name, Phone, Address, GSTIN, Invoice Prefix).
   - Creating the initial Administrator (**Owner**) credentials.

---

## 💼 2. Module Operating Instructions

### A. Dashboard & Real-Time Analytics (`/dashboard`)
- Displays 10 live Key Performance Indicator (KPI) metrics:
  - **Today's Sales & Bills Generated**
  - **Net Revenue** (`Gross Sales - Returns`)
  - **Gross Profit** (`Net Revenue - Cost of Goods Sold`)
  - **Shop Operating Expenses & Net Business Result**
  - **Inventory Units**, **Low Stock**, and **Out of Stock** counters.
  - **Customer Outstanding** and **Supplier Payables**.

### B. Master Catalog & Products (`/products`, `/categories`)
- Add and edit Categories, Brands, Materials, and Products.
- Manage **Size/Color Variants** with independent SKUs, Barcodes, Cost Prices, Selling Prices, Tax Rates (GST), and Minimum Stock Alert Levels.

### C. Point of Sale (POS) & Billing Terminal (`/billing`)
- Search products by Name, SKU, or scan barcodes via USB Barcode Scanner.
- Adjust quantity, select size/color variant, and apply line discounts.
- Select existing Customer or use Default Walk-In Customer.
- Process multiple Payment Modes: **Cash**, **UPI / QR**, **Card**, **Bank Transfer**, **Credit / Pay Later**, and **Split Payment**.
- Instant Thermal Receipt Printing & Invoice PDF export.

### D. Inventory & Stock Movements (`/inventory`)
- Track stock quantities, low-stock warnings, and out-of-stock items.
- Perform manual stock adjustments with audit reason logging (`INITIAL_STOCK`, `PURCHASE`, `SALE`, `RETURN_RESALABLE`, `DAMAGE`, `MANUAL_CORRECTION`).

### E. Purchases & Supplier Balances (`/purchases`, `/suppliers`)
- Register Suppliers with GSTIN, phone, and address.
- Create Purchase Orders with line items; stock quantities automatically increase upon saving.
- Record partial payments and track outstanding supplier balances.

### F. Customers & Credit Ledger (`/customers`)
- Maintain Customer profiles, credit limits, and purchase histories.
- Record outstanding credit payments and review transaction ledgers.

### G. Post-Sale Returns & Product Exchanges (`/returns`)
- Process full or partial sales returns by Invoice Number.
- Specify return condition (`RESALABLE` restores sellable inventory; `DAMAGED` logs to damaged ledger).
- Issue Refunds via Cash, UPI, Card, Bank, or Store Credit.
- Execute Product Exchanges with instant live price difference calculation.

### H. Shop Expense Management (`/expenses`)
- Categorize and log daily operational expenses (Rent, Electricity, Tea, Transport, Salaries).
- Automatically deducted from Gross Profit to compute Net Operating Business Result.

### I. Business Reports & Universal CSV Exporter (`/reports`)
- Multi-tab report center covering Sales Reports, Product Performance, Category Distribution, Inventory Valuation, Dead Stock (90+ days), Financial P&L Statement, and Customer/Supplier Ledgers.
- Universal **Export CSV** link generator for external spreadsheet analysis.

### J. Database Backup & Disaster Recovery (`/backup`, `/health`)
- **Manual Backup**: One-click SHA-256 checksummed SQLite database snapshot.
- **Automated Retention**: Keeps the latest 10 backups and automatically prunes older files.
- **Fail-Safe Restore**: Automatically creates an Emergency Safety Snapshot before restoring, with automatic rollback protection if post-restore integrity fails.
- **System Health**: Displays live SQLite quick_check, foreign key status, and storage metrics.

---

## 🔒 3. User Roles & Security

| Role | Permissions |
| :--- | :--- |
| **Owner** | Full unrestricted access to all modules, settings, user management, and database restores. |
| **Manager** | Access to sales, inventory, purchases, expenses, and business reporting. |
| **Cashier** | Access to POS Billing, customer creation, sales history, and return requests. |
| **Inventory Staff** | Access to stock movements, purchase orders, and supplier catalog. |

---

## 📞 4. Technical Support & Data Maintenance

- **Live Database File**: Preserved safely in `%AppData%\TextileShop\textile-shop.db`.
- **Backups Location**: `%AppData%\TextileShop\Backups\`.
- **Software Updates**: Upgrading or reinstalling the `.exe` will **NEVER** overwrite your existing store database or backups.
