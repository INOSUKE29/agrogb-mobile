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

const files = walk('apps/mobile/mobile_app/src');
let fixed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    const hasStyleSheetCreate = /StyleSheet\.create/.test(content);
    const hasStyleSheetImport = /import\s+.*StyleSheet.*from\s+['"]react-native['"]/.test(content);
    
    if (hasStyleSheetCreate && !hasStyleSheetImport) {
        if (/import\s+\{([^}]*)\}\s+from\s+['"]react-native['"]/.test(content)) {
            content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-native['"]/, (match, p1) => {
                return `import { StyleSheet, ${p1.trim()} } from 'react-native'`;
            });
        } else {
            content = `import { StyleSheet } from 'react-native';\n` + content;
        }
        fs.writeFileSync(file, content, 'utf8');
        fixed++;
        console.log('Fixed:', file);
    }
});

console.log('Total fixed StyleSheet:', fixed);
