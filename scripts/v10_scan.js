const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * AgroGB v10 Quality Gate
 * Scans for common errors requested by the user.
 */

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

const checks = [
    { id: 'COLORS', pattern: /COLORS(?!(\.js|\.ts|['"]|:))/g, description: 'Missing COLORS import or invalid reference' },
    { id: 'logout', pattern: /logout/g, description: 'Unresolved logout references' },
    { id: 'theme', pattern: /theme(?!Config|Provider|Context|Light|Dark|['"]|:)/g, description: 'Direct theme access outside useTheme' },
    { id: 'containerHeight', pattern: /containerHeight/g, description: 'Undefined containerHeight' }
];

function scanFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') scanFiles(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            checks.forEach(check => {
                if (check.pattern.test(content)) {
                    console.log(`[WARNING] ${check.id} found in: ${fullPath.replace(projectRoot, '')}`);
                }
            });
        }
    });
}

console.log('Running AgroGB v10 Professional Scan...');
scanFiles(srcDir);
console.log('Scan Complete.');
