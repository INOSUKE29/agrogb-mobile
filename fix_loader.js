const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('apps/desktop/src');
let fixed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    const hasLoader = /Loader2/.test(content);
    const hasLoaderImport = /import\s+.*Loader2.*from\s+['"]lucide-react['"]/.test(content) || /import\s+\{([^}]*)Loader2([^}]*)\}\s+from\s+['"]lucide-react['"]/.test(content);
    
    if (hasLoader && !hasLoaderImport) {
        if (/import\s+\{([^}]*)\}\s+from\s+['"]lucide-react['"]/.test(content)) {
            content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]lucide-react['"]/, (match, p1) => {
                return `import { Loader2, ${p1.trim()} } from 'lucide-react'`;
            });
            fs.writeFileSync(file, content, 'utf8');
            fixed++;
            console.log('Fixed:', file);
        } else {
            console.log('Needs lucide-react import but has none:', file);
        }
    }
});

console.log('Total fixed Loader2:', fixed);
