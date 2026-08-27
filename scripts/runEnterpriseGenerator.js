/**
 * Standalone Enterprise Data Generator Runner for Ratna Vilas Textile Software
 * Usage: node scripts/runEnterpriseGenerator.js
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('===============================================================');
console.log('   RATNA VILAS (ரத்னா விலாஸ்) - ENTERPRISE MOCK DATA GENERATOR   ');
console.log('===============================================================');

// Ensure electron TypeScript is built
console.log('[BUILD] Compiling electron backend...');
try {
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });
} catch (e) {
  console.error('[ERROR] Failed to compile electron TypeScript files:', e.message);
  process.exit(1);
}

const { initDatabase } = require('../dist-electron/main/database/index');
const { seedEnterpriseDataset } = require('../dist-electron/main/database/enterpriseDataGenerator');

try {
  const dbPath = path.join(process.cwd(), 'textile-shop.db');
  console.log(`[DB] Target Database File: ${dbPath}`);

  const db = initDatabase(dbPath);
  console.log('[DB] Database schema and migrations verified.');

  console.log('[SEED] Seeding enterprise dataset...');
  seedEnterpriseDataset(db);

  console.log('\n===============================================================');
  console.log('               RECORD COUNTS ACROSS ALL MODULES                ');
  console.log('===============================================================');

  const tables = [
    'users',
    'roles',
    'departments',
    'designations',
    'staff',
    'staff_bank_details',
    'staff_emergency_contacts',
    'staff_documents',
    'staff_notes',
    'staff_employment_history',
    'staff_preferences',
    'shift_templates',
    'staff_shift_assignments',
    'staff_schedule_days',
    'staff_shift_overrides',
    'shift_change_requests',
    'shift_swap_requests',
    'attendance_settings',
    'attendance',
    'attendance_corrections',
    'attendance_correction_requests',
    'permission_requests',
    'leave_types',
    'holidays',
    'leave_balances',
    'leave_requests',
    'leave_balance_adjustments',
    'salary_components',
    'salary_structures',
    'salary_structure_components',
    'salary_advances',
    'payroll_periods',
    'payroll_records',
    'payroll_line_items',
    'overtime_records',
    'staff_incentives',
    'payslips',
    'categories',
    'brands',
    'products',
    'product_variants',
    'suppliers',
    'purchases',
    'purchase_items',
    'stock_receiving_records',
    'stock_receiving_items',
    'stock_counts',
    'stock_transfer_requests',
    'inventory_tasks',
    'stock_transactions',
    'customers',
    'customer_preferences',
    'loyalty_accounts',
    'loyalty_transactions',
    'customer_notes',
    'sales',
    'sale_items',
    'payments',
    'returns',
    'return_items',
    'held_sales',
    'expenses',
    'appraisal_cycles',
    'performance_goals',
    'staff_performance_kpis',
    'performance_reviews',
    'performance_self_reviews',
    'appraisals',
    'performance_incentives',
    'announcements',
    'staff_messages',
    'system_notifications',
    'audit_logs'
  ];

  let totalCount = 0;
  const summary = [];

  for (const t of tables) {
    try {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get();
      const count = row ? row.count : 0;
      totalCount += count;
      summary.push({ Table: t, Records: count });
    } catch (e) {
      summary.push({ Table: t, Records: `Table not found / ${e.message}` });
    }
  }

  console.table(summary);
  console.log(`\n>>> TOTAL ENTERPRISE RECORDS GENERATED: ${totalCount} records.`);
  console.log('>>> Enterprise Mock Data generation completed successfully! 🎉\n');

} catch (err) {
  console.error('[ERROR] Seeding failed:', err);
  process.exit(1);
}
