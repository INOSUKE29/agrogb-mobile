
const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');
const files = [];

function getFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            files.push(fullPath);
        }
    });
}

getFiles(srcDir);

let errorCount = 0;
const report = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    // Check for colors.error (invalid token)
    if (content.includes('colors.error')) {
        const lineNum = lines.findIndex(l => l.includes('colors.error')) + 1;
        report.push(`[COLOR ERROR] ${path.basename(file)}:${lineNum} - Use of invalid token 'colors.error'`);
        errorCount++;
    }

    // Check for colors.primaryDark
    if (content.includes('colors.primaryDark')) {
        // Technically I just fixed this in theme, but let's see where it's used
    }

    // Check for unsafe color concatenations
    const unsafeConcatRegex = /(['"]?\w+['"]?\s*:\s*colors\.\w+\s*\+\s*['"](?!#)\w+['"])/g;
    let match;
    while ((match = unsafeConcatRegex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        report.push(`[UNSAFE CONCAT] ${path.basename(file)}:${lineNum} - Unsafe: ${match[0]}`);
        errorCount++;
    }

    // Check for missing fallback in common places
    if (content.includes("colors.destructive")) {
        report.push(`[DEPRECATED TOKEN] ${path.basename(file)} - Use of 'colors.destructive' instead of 'colors.danger'`);
    }
});

console.log(`Total Issues Found: ${report.length}`);
report.forEach(r => console.log(r));
