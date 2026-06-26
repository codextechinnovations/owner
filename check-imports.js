const fs = require('fs');
const path = require('path');

const HTML_LIKE = new Set([
  'Suspense','Fragment','StrictMode','Profiler','Component','Navigate','Route','Routes','Router',
  'BrowserRouter','Link','NavLink','Outlet','ThemeProvider','CssBaseline','AuthProvider','AuthContext',
  'ErrorBoundary','RouterLink',' LocalizationProvider','DatePicker','AdapterDateFns'
]);

function walk(dir) {
  const issues = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      issues.push(...walk(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf-8');
      const imported = new Set();
      const importBlock = text.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g) || [];
      for (const line of importBlock) {
        const m = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
        if (!m) continue;
        const names = m[1].split(',').map(n => {
          const parts = n.trim().split(/\s+as\s+/).map(s => s.trim());
          return parts.length > 1 ? parts[1] : parts[0];
        });
        for (const n of names) imported.add(n);
      }
      const defaultImports = text.match(/import\s+(\w+)\s+from\s+['"][^'"]+['"]/g) || [];
      for (const line of defaultImports) {
        const m = line.match(/import\s+(\w+)\s+from/);
        if (m) imported.add(m[1]);
      }
      const starImports = text.match(/import\s+\*\s+as\s+(\w+)\s+from/g) || [];
      for (const line of starImports) {
        const m = line.match(/import\s+\*\s+as\s+(\w+)\s+from/);
        if (m) imported.add(m[1]);
      }

      // Local component definitions
      const localDefs = new Set();
      const compRe = /(?:const|function)\s+([A-Z][a-zA-Z0-9_]*)\s*(?:=|\()/g;
      let cm;
      while ((cm = compRe.exec(text)) !== null) localDefs.add(cm[1]);

      const tags = new Set();
      let m;
      const tagRe = /<([A-Z][a-zA-Z0-9_]*)/g;
      while ((m = tagRe.exec(text)) !== null) tags.add(m[1]);

      const undefinedTags = [...tags].filter(t => {
        if (imported.has(t)) return false;
        if (localDefs.has(t)) return false;
        if (HTML_LIKE.has(t)) return false;
        if (t.startsWith('use') && t.length > 3 && t[3] >= 'A' && t[3] <= 'Z') return false; // hooks
        return true;
      });
      if (undefinedTags.length) issues.push({ file: full, names: undefinedTags });
    }
  }
  return issues;
}

const issues = walk(path.join(__dirname, 'src'));
if (issues.length) {
  console.log('POTENTIALLY MISSING IMPORTS:');
  for (const { file, names } of issues) {
    console.log(`${file}: ${names.join(', ')}`);
  }
} else {
  console.log('No obvious missing imports found.');
}
