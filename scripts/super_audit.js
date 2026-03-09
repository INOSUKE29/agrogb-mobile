const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

const COLORS_KEYS = ['white', 'black', 'transparent', 'lightPrimary', 'darkPrimary', 'success', 'warning', 'danger', 'info', 'light', 'dark'];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let errors = 0;

    lines.forEach((line, i) => {
        // Check for broken relative imports
        if (line.includes("from './colors'") || line.includes("from './radius'") || line.includes("from './spacing'")) {
            console.log(`[ERROR] Relative import detected: ${filePath}:${i + 1} -> ${line.trim()}`);
            errors++;
        }

        // Check for COLORS.primary (which is undefined)
        if (line.includes("COLORS.primary") && !line.includes("COLORS.primaryLight") && !line.includes("COLORS.primaryDark")) {
            // Check if it's not light.primary or dark.primary
            if (!line.includes("COLORS.light.primary") && !line.includes("COLORS.dark.primary")) {
                console.log(`[ERROR] Undefined COLORS.primary: ${filePath}:${i + 1} -> ${line.trim()}`);
                errors++;
            }
        }
    });
    return errors;
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules') walk(fullPath);
        } else if (file.endsWith('.js')) {
            checkFile(fullPath);
        }
    });
}

console.log('--- STARTING SUPER AUDIT v10.4 ---');
walk(srcDir);
console.log('--- AUDIT COMPLETE ---');
