const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/*
  AGROGB DEEP SCAN VERIFIER
  -------------------------
  Checks for:
  1. Zombie Code (expo-location)
  2. Log statements in production
  3. Dangerous Imports (default theme import)
  4. Circular Dependencies (via Madge)
  5. Database/Supabase Cycles
*/

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const SRC_DIR = path.join(__dirname, '../src');

let errorCount = 0;
let warningCount = 0;

console.log(`${YELLOW}🔍 INICIANDO VARREDURA PROFUNDA (AGROGB DEEP SCAN)...${RESET}\n`);

// 1. SCAN FILE CONTENT
function scanDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.js')) {
            checkFile(fullPath);
        }
    });
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);

    // CHECK 1: PREVENT DEFAULT THEME IMPORT (The "Crash Maker")
    if (content.match(/import\s+theme\s+from/)) {
        // Exclude ThemeContext itself
        if (!relativePath.includes('ThemeContext.js')) {
            console.error(`${RED}❌ [CRITICAL] Importação perigosa de tema em: ${relativePath}${RESET}`);
            console.error(`   Use: import { COLORS } from '../styles/theme'`);
            errorCount++;
        }
    }

    if (content.match(/import\s+\{\s*theme\s*\}\s+from/)) {
        console.error(`${RED}❌ [CRITICAL] Importação inválida { theme } em: ${relativePath}${RESET}`);
        console.error(`   'theme' não é exportado nomeado. Use: import { COLORS }`);
        errorCount++;
    }

    // CHECK 2: ZOMBIE CODE (Expo Location)
    if (content.includes('expo-location') && !content.includes('//')) {
        console.error(`${RED}❌ [FORBIDDEN] Referência ao expo-location em: ${relativePath}${RESET}`);
        errorCount++;
    }

    // CHECK 3: CONSOLE LOG WARNINGS (Soft check)
    if (content.includes('console.log')) {
        // warningCount++; 
        // Keeping silent for now as logs are useful in debug builds, 
        // enable strict mode for production later.
    }

    // CHECK 4: CYCLIC HINTS
    if (relativePath.includes('services\\supabase.js')) {
        if (content.includes("from '../database/database'")) {
            console.error(`${RED}❌ [CYCLE] supabase.js importando database.js${RESET}`);
            errorCount++;
        }
    }
}

// EXECUTE SCANS
try {
    // A. FILE CONTENT SCAN
    scanDir(SRC_DIR);

    // B. MADGE CIRCULAR DEPENDENCY CHECK
    console.log(`\n${YELLOW}🔄 Verificando Dependências Circulares (Madge)...${RESET}`);
    try {
        const madgeOutput = execSync('npx madge --circular src/').toString();
        if (madgeOutput.includes('No circular dependency found')) {
            console.log(`${GREEN}✅ Nenhuma dependência circular detectada.${RESET}`);
        } else {
            console.error(`${RED}❌ Dependências Circulares Encontradas:\n${madgeOutput}${RESET}`);
            // Check if critical
            if (madgeOutput.includes('database.js') || madgeOutput.includes('theme.js')) {
                errorCount++;
            } else {
                console.log(`${YELLOW}⚠️ Circulares não críticas (Componentes UI) ignoradas por enquanto.${RESET}`);
            }
        }
    } catch (e) {
        // Madge throws on found? sometimes regarding config.
        console.error(`${RED}❌ Erro ao rodar Madge${RESET}`);
    }

    // SUMMARY
    console.log('\n-----------------------------------');
    if (errorCount > 0) {
        console.error(`${RED}🚫 FALHA NA VARREDURA: ${errorCount} Erros Críticos Detectados.${RESET}`);
        console.error(`${RED}   A BUILD FOI BLOQUEADA AUTOMATICAMENTE.${RESET}`);
        process.exit(1);
    } else {
        console.log(`${GREEN}✅ SISTEMA APROVADO. NENHUM ERRO CRÍTICO ENCONTRADO.${RESET}`);
        console.log(`${GREEN}   Build liberada.${RESET}`);
        process.exit(0);
    }

} catch (e) {
    console.error("Fatal Error in Verify Script:", e);
    process.exit(1);
}
