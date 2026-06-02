const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
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

const files = walk(srcDir);
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Substituir imports de context/ThemeContext para theme/ThemeContext
    if (content.includes('context/ThemeContext')) {
        content = content.replace(/['"](\.\.|\.)\/([./]*?)context\/ThemeContext['"]/g, "'$1/$2theme/ThemeContext'");
        changed = true;
    }
    
    // Substituir imports de context/WeatherContext para theme/WeatherContext (se movermos context pra services, etc)
    // Wait, WeatherContext and AuthContext are in context/.
    
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Updated:', file);
    }
});

console.log(`Refatoração concluída! ${changedCount} arquivos atualizados.`);
