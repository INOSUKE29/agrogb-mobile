const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🛡️  INICIANDO SUPER AUDIT v12.0 (DEEP SCAN & TEST)...");

try {
    console.log("\nStep 1: ESLint Check...");
    execSync('npm run lint', { stdio: 'inherit' });

    console.log("\nStep 2: Senior Auditor Scan (Security & Integrity)...");
    execSync('node scripts/super_audit.js', { stdio: 'inherit' });

    console.log("\nStep 3: Automated Unit & Component Tests (Jest)...");
    execSync('npm run test', { stdio: 'inherit' });

    console.log("\n✅ Auditoria Profunda concluída! O projeto está estável para build.");
} catch (error) {
    console.error("\n❌ AUDITORIA FALHOU: Build bloqueada por motivos de segurança.");
    process.exit(1);
}
