
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

    // Fix 1: Deprecated tokens
    if (content.includes('colors.error')) {
        content = content.replace(/colors\.error/g, 'colors.danger');
        changed = true;
    }
    if (content.includes('colors.destructive')) {
        content = content.replace(/colors\.destructive/g, 'colors.danger');
        changed = true;
    }

    // Fix 2: Unsafe color concatenations
    // Matches patterns like colors.primary + '15' or colors.text + "40"
    const concatRegex = /colors\.(\w+)\s*\+\s*(['"]\w+['"])/g;

    // We also need to avoid double fixing if we already added a fallback.
    // The regex above will match correctly.

    const newContent = content.replace(concatRegex, (match, token, suffix) => {
        // Default fallbacks based on common tokens
        let fallback = '#1E8E5A'; // lightPrimary default
        if (token === 'danger') fallback = '#EF4444';
        if (token === 'warning') fallback = '#F59E0B';
        if (token === 'info') fallback = '#3B82F6';
        if (token === 'success') fallback = '#10B981';
        if (token === 'text' || token === 'textPrimary') fallback = '#1F2937';
        if (token === 'card') fallback = '#FFFFFF';

        changed = true;
        return `(colors.${token} || '${fallback}') + ${suffix}`;
    });

    content = newContent;

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`FIXED: ${path.basename(file)}`);
    }
});
