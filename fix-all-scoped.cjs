const fs = require('fs');
const path = require('path');

function restoreDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      
      // If it's a temp directory like .parser-WIOPrcaE
      if (entry.name.startsWith('.') && entry.name.includes('-') && !entry.name.startsWith('.bin')) {
        const match = entry.name.match(/^\.(.+)-[a-zA-Z0-9]+$/);
        if (match) {
          const targetName = match[1];
          const targetPath = path.join(dir, targetName);
          console.log(`Restoring scoped: ${fullPath} -> ${targetPath}`);
          if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
          fs.cpSync(fullPath, targetPath, { recursive: true });
        }
      } else if (entry.name.startsWith('@')) {
        // Recurse into scoped modules (@babel, @vitejs, etc.)
        restoreDirectory(fullPath);
      }
    }
  }
}

const nm = path.join(__dirname, 'node_modules');
restoreDirectory(nm);
console.log('All scoped and top-level packages restored successfully!');
