const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInDir(fullPath);
    } else if (/\.(tsx|ts|jsx|js|css|html)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      // Replace hex codes
      content = content.replace(/#2818cf/gi, '#2012ad');
      content = content.replace(/#006ec7/gi, '#2012ad');
      content = content.replace(/#0058a3/gi, '#1a0e91');
      content = content.replace(/#054a85/gi, '#150b74');

      // Also replace hover shades if needed
      // hover:bg-[#2012ad] when base was #2818cf => hover:bg-[#1a0e91]
      content = content.replace(/bg-\[#2012ad\]\s+hover:bg-\[#2012ad\]/g, 'bg-[#2012ad] hover:bg-[#1a0e91]');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${path.relative(srcDir, fullPath)}`);
      }
    }
  }
}

replaceInDir(srcDir);
console.log('Finished updating brand colors.');
