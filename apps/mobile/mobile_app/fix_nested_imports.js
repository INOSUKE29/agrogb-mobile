const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'components', 'ui');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(targetDir);
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // A pasta `ui/` desceu um nível (para `components/ui/`). 
    // Então os imports que subiam um nível (`../`) para acessar a raiz `src/` (como ../services, ../theme, ../database, ../context)
    // agora precisam subir dois níveis (`../../`).
    
    const rootFolders = ['services', 'theme', 'database', 'context', 'modules', 'components'];
    
    rootFolders.forEach(folder => {
        // Regex para trocar `../folder` por `../../folder` mas não tocar se já for `../../folder`
        const regex = new RegExp(`['"]\\.\\.\\/${folder}\\/`, 'g');
        if (content.match(regex)) {
            content = content.replace(regex, "'../../" + folder + "/");
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Fixed relative imports in:', file);
    }
});

console.log(`Fix concluído! ${changedCount} arquivos ajustados.`);
