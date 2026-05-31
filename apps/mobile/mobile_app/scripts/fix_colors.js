
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

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix 1: Replace colors.error with colors.danger
    if (content.includes('colors.error')) {
        content = content.replace(/colors\.error/g, 'colors.danger');
        changed = true;
    }

    // Fix 2: Safety for color concatenations (Optional but safer)
    // Actually, I'll just rely on colors.danger/primary being defined now.

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`FIXED: ${path.basename(file)}`);
    }
});
