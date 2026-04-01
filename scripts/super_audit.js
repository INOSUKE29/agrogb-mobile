const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

const COLORS_KEYS = ['white', 'black', 'transparent', 'lightPrimary', 'darkPrimary', 'success', 'warning', 'danger', 'info', 'light', 'dark'];

// Senior Auditor Regex Patterns
const SECRET_PATTERN = /(apiKey|secret|password|token|key|key_anon|service_role)\s*=\s*['"][a-zA-Z0-9_-]{20,}['"]/i;
const CONSOLE_LOG_PATTERN = /console\.log\(/;
const ASYNC_STORAGE_SENSITIVE = /AsyncStorage\.setItem\(['"](auth|token|password|session|key)/i;

let totalErrors = 0;
let totalWarnings = 0;

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    let fileErrors = 0;
    let fileWarnings = 0;

    lines.forEach((line, i) => {
        const lineNum = i + 1;

        // 🛡️ SECURITY AUDIT
        if (SECRET_PATTERN.test(line)) {
            console.error(`🔴 [CRITICAL SECURITY] Hardcoded potential secret in ${fileName}:${lineNum}`);
            console.error(`   > ${line.trim()}`);
            fileErrors++;
        }

        if (ASYNC_STORAGE_SENSITIVE.test(line)) {
            console.warn(`⚠️ [SECURITY WARNING] Potentially sensitive data in AsyncStorage ${fileName}:${lineNum}`);
            console.warn(`   > Use SecureStore for credentials.`);
            fileWarnings++;
        }

        // 📏 BEST PRACTICES
        if (CONSOLE_LOG_PATTERN.test(line)) {
            fileWarnings++;
        }

        // 🎨 DESIGN SYSTEM INTEGRITY
        // Check for broken relative imports
        if (line.includes("from './colors'") || line.includes("from './radius'") || line.includes("from './spacing'")) {
            console.error(`❌ [DESIGN ERROR] Broken relative import: ${fileName}:${lineNum}`);
            fileErrors++;
        }

        // Check for COLORS.primary (which is undefined)
        if (line.includes("COLORS.primary") && !line.includes("COLORS.primaryLight") && !line.includes("COLORS.primaryDark")) {
            if (!line.includes("COLORS.light.primary") && !line.includes("COLORS.dark.primary")) {
                console.error(`❌ [DESIGN ERROR] Undefined COLORS.primary: ${fileName}:${lineNum}`);
                fileErrors++;
            }
        }
    });

    totalErrors += fileErrors;
    totalWarnings += fileWarnings;
    return { errors: fileErrors, warnings: fileWarnings };
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.expo') walk(fullPath);
        } else if (file.endsWith('.js')) {
            checkFile(fullPath);
        }
    });
}

console.log('--- 🛡️  SENIOR AUDIT v12.0 STARTING (DEEP ANALYSIS) ---');
walk(srcDir);

console.log('\n--- 📊 AUDIT SUMMARY ---');
if (totalErrors > 0) {
    console.error(`❌ FAILED: ${totalErrors} Critical Errors found.`);
} else {
    console.log(`✅ PASSED: No critical errors found.`);
}
console.log(`⚠️  ADVISORY: ${totalWarnings} Warnings found (Check logs).`);
console.log('------------------------\n');

if (totalErrors > 0) {
    process.exit(1);
}
