const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('apps/mobile/mobile_app/src', function(filePath) {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if we have multiple imports of StyleSheet
    const matches = [...content.matchAll(/StyleSheet/g)];
    // We only care about imports, let's use a regex that captures all imports from react-native
    const rnImportsMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]react-native['"]/g);
    
    if (rnImportsMatch && rnImportsMatch.length > 0) {
        let newContent = content;
        // Count how many times StyleSheet appears inside react-native imports
        let styleSheetCount = 0;
        let fixedImports = rnImportsMatch.map(imp => {
            if (imp.includes('StyleSheet')) {
                styleSheetCount++;
                if (styleSheetCount > 1) {
                    // Remove StyleSheet from this import
                    return imp.replace(/,\s*StyleSheet/g, '').replace(/StyleSheet\s*,/g, '').replace(/{\s*StyleSheet\s*}/g, '{}');
                }
            }
            return imp;
        });

        if (styleSheetCount > 1) {
            rnImportsMatch.forEach((oldImp, i) => {
                newContent = newContent.replace(oldImp, fixedImports[i]);
            });
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Fixed duplicate StyleSheet in ${filePath}`);
        }
    }
});
