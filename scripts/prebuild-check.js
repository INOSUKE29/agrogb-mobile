const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🛡️  INICIANDO SUPER AUDIT v10.7 (DEEP SCAN)...");

const checkImports = (dir) => {
    let hasError = false;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.expo') {
                if (checkImports(fullPath)) hasError = true;
            }
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (line.includes('import ') && line.includes('from \'./') || line.includes('from \'../')) {
                    const match = line.match(/from\s+['"]([^'"]+)['"]/);
                    if (match) {
                        const importPath = match[1];
                        const baseDir = path.dirname(fullPath);
                        let targetPath = path.resolve(baseDir, importPath);

                        // Check common extensions
                        const exists = fs.existsSync(targetPath) ||
                            fs.existsSync(targetPath + '.js') ||
                            fs.existsSync(targetPath + '/index.js');

                        if (!exists) {
                            console.error(`❌ ERRO DE IMPORT EM [${path.basename(fullPath)}:${index + 1}]: Arquivo não encontrado -> ${importPath}`);
                            hasError = true;
                        }
                    }
                }
            });
        }
    });
    return hasError;
};

try {
    console.log("\nStep 1: ESLint Check...");
    execSync('npm run lint', { stdio: 'inherit' });

    console.log("\nStep 2: Deep Import Integrity Scan...");
    const rootSrc = path.join(__dirname, '..', 'src');
    const importErrors = checkImports(rootSrc);

    if (importErrors) {
        throw new Error("Falha na integridade dos imports.");
    }

    console.log("\n✅ Auditoria Profunda concluída! O projeto está estável.");
} catch (error) {
    console.error("\n❌ AUDITORIA FALHOU: Build bloqueada por motivos de segurança.");
    console.error(error.message);
    process.exit(1);
}
