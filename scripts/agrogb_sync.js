const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'apps', 'mobile', 'mobile_app', 'src');

console.log('🌱 [AgroGB] Iniciando Auditoria de Código e Sincronização GitHub...');

function searchForMocks(dir) {
    let mockFound = false;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (searchForMocks(fullPath)) mockFound = true;
        } else if (stat.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Verifica padrões que violam a Regra 8 de Tolerância Zero a Mocks em listas e serviços.
            // Permite uso de "Mock" apenas em arquivos de teste (.test.js) ou configurações de dev específicas.
            if (content.includes('MOCK_') && !fullPath.includes('.test.')) {
                console.error(`❌ [Regra 8 Violada] Mock Detectado no arquivo: ${fullPath}`);
                mockFound = true;
            }
        }
    }
    return mockFound;
}

console.log('🔍 Varrendo base de código em busca de Mocks (Regra 8)...');
const hasMocks = searchForMocks(SRC_DIR);

if (hasMocks) {
    console.error('\n🚨 SINCRONIZAÇÃO ABORTADA! 🚨');
    console.error('Foram encontrados dados Mocks hardcoded no projeto.');
    console.error('Por favor, siga a Regra 8 e implemente o "Empty State" elegante ou falha graciosa caso offline.');
    process.exit(1);
}

console.log('✅ Nenhuma violação da Regra 8 detectada. Preparando Push para o GitHub...');

try {
    console.log('>> Executando git add .');
    execSync('git add .', { cwd: ROOT_DIR, stdio: 'inherit' });
    
    console.log('>> Executando git commit...');
    try {
        execSync('git commit -m "chore: Auto-sync e auditoria concluída (Regra 8)"', { cwd: ROOT_DIR, stdio: 'inherit' });
    } catch (commitErr) {
        // Ignora erro se não houver nada para commitar
        if (!commitErr.message.includes('nothing to commit')) {
            console.log('Nenhuma alteração pendente para commit ou erro menor no commit.');
        }
    }

    console.log('>> Executando git push origin main...');
    execSync('git push origin main', { cwd: ROOT_DIR, stdio: 'inherit' });
    
    console.log('🚀 Sucesso! Código sincronizado com GitHub de forma íntegra e segura.');
} catch (error) {
    console.error('\n❌ Erro durante o push para o GitHub. Verifique suas credenciais de rede ou se há conflitos.');
    process.exit(1);
}
