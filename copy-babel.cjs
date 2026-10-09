const fs = require('fs');
const path = require('path');

const babelDir = path.join(__dirname, 'node_modules', '@babel');
const entries = fs.readdirSync(babelDir);

for (const entry of entries) {
  if (entry.startsWith('.')) {
    const match = entry.match(/^\.(.+)-[a-zA-Z0-9]+$/);
    if (match) {
      const targetName = match[1];
      const src = path.join(babelDir, entry);
      const dest = path.join(babelDir, targetName);
      console.log(`Copying babel: ${entry} -> ${targetName}`);
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      fs.cpSync(src, dest, { recursive: true });
    }
  }
}
console.log('Babel packages restored!');
