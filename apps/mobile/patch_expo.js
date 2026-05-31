const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'externals.js');

if (fs.existsSync(targetPath)) {
    let content = fs.readFileSync(targetPath, 'utf8');

    // MÁXIMA FORÇA: Interceptar o array de módulos e arrancar 'node:sea' antes de tudo
    if (!content.includes('.filter(x => x !== "node:sea")')) {
        // Encontrar a linha onde o Expo define NODE_STDLIB_MODULES e anexar um filtro brutal
        content = content.replace(
            /(exports\.NODE_STDLIB_MODULES\s*=\s*(?:\[.*?\]|.*?\.sort\(\)));/g,
            '$1\nexports.NODE_STDLIB_MODULES = exports.NODE_STDLIB_MODULES.filter(x => x !== "node:sea");'
        );

        fs.writeFileSync(targetPath, content, 'utf8');
        console.log('✅ PATCH ABSOLUTO EXPO CLI APLICADO: node:sea foi brutalmente obliterado do array do Expo!');
    } else {
        console.log('⚠️ Patch já estava aplicado.');
    }
} else {
    console.log('❌ Arquivo externals.js não encontrado: ' + targetPath);
}
