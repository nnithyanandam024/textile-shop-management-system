const fs = require('fs');
const path = require('path');

const unitDir = path.resolve(__dirname, '../tests/unit');
const files = fs.readdirSync(unitDir).filter(f => f.endsWith('.test.ts'));

for (const file of files) {
  const filePath = path.join(unitDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix any line that has ${ inside single quotes in path.join(__dirname, '...${...}...')
  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    if (line.includes('${') && line.includes("path.join(__dirname, '../.test_db/test_")) {
      return line.replace("path.join(__dirname, '../.test_db/test_", "path.join(__dirname, `../.test_db/test_")
                 .replace(".db');", ".db`);")
                 .replace(".db')", ".db`)");
    }
    if (line.includes('${') && line.includes('path.join(__dirname, "../.test_db/test_')) {
      return line.replace('path.join(__dirname, "../.test_db/test_', 'path.join(__dirname, `../.test_db/test_')
                 .replace('.db");', '.db`);')
                 .replace('.db")', '.db`)');
    }
    return line;
  });

  fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf-8');
}

console.log('Template literal quotes fixed!');
