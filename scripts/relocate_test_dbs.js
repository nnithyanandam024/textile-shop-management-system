const fs = require('fs');
const path = require('path');

const unitDir = path.resolve(__dirname, '../tests/unit');
const testDbDir = path.resolve(__dirname, '../tests/.test_db');

if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

const files = fs.readdirSync(unitDir).filter(f => f.endsWith('.test.ts'));

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(unitDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // 1. Replace path.join(__dirname, '../../test_
  content = content.replace(/path\.join\(__dirname,\s*['"`]\.\.\/\.\.\/test_/g, "path.join(__dirname, '../.test_db/test_");
  
  // 2. Replace path.join(process.cwd(), 'test_
  content = content.replace(/path\.join\(process\.cwd\(\),\s*['"`]test_/g, "path.join(__dirname, '../.test_db/test_");
  content = content.replace(/path\.join\(process\.cwd\(\),\s*`test_/g, "path.join(__dirname, `../.test_db/test_");

  // 3. Replace testBackupDir = path.join(__dirname, '../../test_phase17_backups'
  content = content.replace(/path\.join\(__dirname,\s*['"`]\.\.\/\.\.\/test_phase17_backups['"`]\)/g, "path.join(__dirname, '../.test_db/test_phase17_backups')");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${file}`);
    updatedCount++;
  }
}

console.log(`\nSuccessfully relocated test database paths in ${updatedCount} test files to tests/.test_db/`);
