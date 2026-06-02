const fs = require('fs');
const path = require('path');

const srcUi = path.join(__dirname, 'src', 'ui');
const destUi = path.join(__dirname, 'src', 'components', 'ui');

// Ensure destination exists
if (!fs.existsSync(destUi)) {
    fs.mkdirSync(destUi, { recursive: true });
}

// Mover arquivos e pastas
function moveAll(src, dest) {
    if (!fs.existsSync(src)) return;
    const items = fs.readdirSync(src);
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        // Evitar sobrescrever se já existir em components/ (no caso de duplicatas, não sobrescreve os principais)
        if (fs.existsSync(destPath)) {
            console.log(`Skipping ${item} (already exists)`);
        } else {
            fs.renameSync(srcPath, destPath);
        }
    });
}
moveAll(srcUi, destUi);

// Limpar diretório ui velho
try {
    fs.rmSync(srcUi, { recursive: true, force: true });
} catch(e) {}

// Atualizar Imports
const appDir = __dirname;
function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (file.includes('node_modules') || file.includes('.git') || file.includes('build')) return;
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(appDir);
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Matches imports from 'src/ui/...' or '../components/ui/...'
    if (content.match(/['"](\.\.|\.)\/([./]*?)ui\/([^'"]+)['"]/)) {
        content = content.replace(/['"](\.\.|\.)\/([./]*?)ui\/([^'"]+)['"]/g, "'$1/$2components/ui/$3'");
        changed = true;
    }
    
    // Fix App.js ./src/ui
    if (content.includes("'./src/components/ui/")) {
        content = content.replace(/'\.\/src\/ui\//g, "'./src/components/ui/");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Updated UI imports in:', file);
    }
});

console.log(`Refatoração UI concluída! ${changedCount} arquivos atualizados.`);
