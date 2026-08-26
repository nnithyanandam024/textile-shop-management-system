# 🚀 TEXORA TEXTILE SHOP MANAGEMENT SYSTEM
## Multi-Laptop Installation, Distribution & Demonstration Guide

This guide details how to install and showcase the **Texora Textile Shop Management System** on any other Windows laptop or PC without needing Node.js, developer tools, or internet connectivity.

---

## 📁 1. Generated Package Files

The production Windows binaries are located in the `release/` folder:

| File Name | File Size | Description & Best Use Case |
|---|---|---|
| **`Textile Shop Management System 0.1.0.exe`** | ~98 MB | **Portable Standalone Executable (Recommended for Fast Demos)**<br>• Runs directly without installation or admin privileges.<br>• Copy to a USB flash drive and run on any laptop immediately. |
| **`Textile Shop Management System Setup 0.1.0.exe`** | ~98 MB | **Standard NSIS Windows Installer**<br>• Installs into `AppData\Local\Programs`.<br>• Creates Desktop & Start Menu shortcuts.<br>• Includes Windows uninstaller. |
| **`win-unpacked/`** | — | **Uncompressed Application Folder**<br>• Direct executable folder for testing or kiosk distribution. |

---

## 💻 2. How to Install & Run on Another Laptop

### Step 1: Copy the File
1. Plug a **USB Flash Drive** into your development machine.
2. Copy `Textile Shop Management System 0.1.0.exe` (or the Setup Installer) onto the USB drive.
   *(Alternatively, upload it to Google Drive / OneDrive and download it onto the client laptop).*

### Step 2: Launch the App
1. On the target laptop, copy the `.exe` to the Desktop or run directly from the USB drive.
2. **Double-click** the `.exe` to open.

> [!NOTE]
> **Windows SmartScreen Prompt (If shown):**
> Because this is a newly built custom enterprise build without an EV code signing certificate, Windows might display a blue *"Windows protected your PC"* banner.
> 1. Click **"More info"**
> 2. Click **"Run anyway"**
> This prompt only appears once on the first launch.

### Step 3: Automatic First-Boot Provisioning
On the very first launch, the application automatically:
- Creates a local SQLite database in `%APPDATA%\Textile Shop Management System\textile-shop.db`.
- Executes all 23 database migrations.
- Auto-seeds a realistic Indian textile catalog (Silk Sarees, Cotton Shirts, Kurtis, Dhotis, Lehengas), sample customers, suppliers, and role accounts.

---

## 🔑 3. Demo User Accounts Cheat Sheet

Use these pre-seeded accounts to demonstrate the 5 distinct role experiences:

| Role | Username | Password | Purpose & What to Show |
|---|---|---|---|
| 👑 **Owner / Admin** | `admin` | `password123` | **Executive Business Dashboard**<br>• Total Sales, Revenue, Gross Profit, Cash Flow<br>• 7-Day Revenue Trajectory Chart & Top Sellers<br>• AI Executive Summary & Risk Anomalies<br>• Full Access to System Settings, Roles & Backups |
| 👨‍💼 **Store Manager** | `manager` | `password123` | **Store Management Dashboard**<br>• Store Sales, Inventory Valuation & Stock Alerts<br>• AI Demand Forecasting & Reorder Priorities<br>• Supplier Purchases (GRN) & Staff Directory |
| 👨‍💼 **Floor Supervisor** | `manager` / `arun.cashier` | `password123` | **Floor Operations Dashboard**<br>• Floor Stock, Urgent Restocking Queue<br>• Shift Staff Roster & Daily Operations Checklist |
| 🧾 **Cashier** | `arun.cashier` | `password123` | **Cashier Billing Register & POS Terminal**<br>• Today's Register Cash & UPI Tender Balances<br>• Press `F2` for Fast Barcode / SKU Scan<br>• Press `F6` for Multi-Payment & Split Tender<br>• 80mm Thermal Receipt Slip & A4 Tax Invoice |
| 👷 **Sales Staff** | `priya.sales` | `password123` | **Personal Work & Self-Service Portal**<br>• Assigned Department Stock & Product Lookup<br>• Personal Shift Schedule & Attendance Punch In/Out<br>• Leave Requests, Payslips & Notice Board<br>• **100% Restricted from Executive Financials** |

---

## 🎯 4. Recommended 5-Minute Client Demonstration Script

### Step 1: The Executive Overview (Login: `admin`)
1. Point out the **Live Sales & Profit KPIs** (Net Revenue, Gross Margin, Liquid Cash Flow).
2. Show the **AI Executive Summary Banner** with intelligent business insights.
3. Open **AI Sales Analytics Modal** by clicking *"AI Analytics"*.

### Step 2: High-Speed POS Billing (Login: `arun.cashier`)
1. Click **"Open POS Terminal (F2)"** or navigate to **POS Billing**.
2. Type or select a product (e.g. *Kanchipuram Pure Zari Silk Saree*).
3. Select a Customer (e.g. *Anand Sundaram*).
4. Click **"Pay & Bill (F6)"**:
   - Demonstrate **Split Payment** (₹5,000 Cash + balance on UPI with instant dynamic QR code).
   - Click **"Complete Checkout"**.
5. Show the **Payment Success Screen**:
   - Preview **Thermal Receipt Slip (80mm)**.
   - Preview **A4 Tax Invoice (GST compliant with amount in words)**.
   - Show instant Print & WhatsApp share buttons.

### Step 3: Inventory Intelligence & Smart Reordering (Login: `manager`)
1. Go to **Inventory** $\to$ Show Low Stock Alerts and Barcode / Stock statuses.
2. Show how **Purchase Cost** is visible only to Managers/Admins, while regular staff see *"View Only"*.
3. Go to **Purchases (GRN)** to demonstrate stock inwarding from mills/suppliers.

### Step 4: Role Isolation Proof (Login: `priya.sales`)
1. Log in as staff (`priya.sales`).
2. Show how the sidebar dynamically strips away Financial Reports, Settings, Payroll, and Admin tools.
3. Show the **Personal Work Workspace**: Shift roster, punch in/out, and personal documents.
4. Try typing `/reports` or `/settings` in the address bar to demonstrate the **Dual-Layer Route Guard & Access Denied** protection.

---

## ⚙️ 5. How to Re-Package New Builds in the Future

Whenever you make new code updates, simply run:

```bash
# Build both Installer and Portable binaries:
npm run package:win

# Or build individually:
npm run package:portable    # Generates portable standalone .exe
npm run package:installer   # Generates NSIS setup wizard .exe
```

The new executables will automatically appear in `release/`.
