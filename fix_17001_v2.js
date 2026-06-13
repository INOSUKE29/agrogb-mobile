const fs = require('fs');
const files = [
    'src/screens/EquipesScreen.js',
    'src/screens/EstoqueScreen.js',
    'src/screens/FinanceiroScreen.js',
    'src/screens/TalhoesScreen.js'
];
for(let file of files) {
    let code = fs.readFileSync('apps/mobile/mobile_app/' + file, 'utf8');
    // We just want to remove duplicate props from <ScreenLayout ...>
    // Just find <ScreenLayout ... > and parse the props or do a simple replace
    
    // Instead of doing regex on the whole file, let's manually remove duplicate scrollable and noPadding
    code = code.replace(/scrollable scrollable/g, 'scrollable');
    code = code.replace(/noPadding=\{true\} noPadding=\{true\}/g, 'noPadding={true}');
    
    // Remove duplicate title="Equipes" title="Equipes" etc
    code = code.replace(/title="Equipes" title="Equipes"/g, 'title="Equipes"');
    code = code.replace(/title="Estoque" title="Estoque"/g, 'title="Estoque"');
    code = code.replace(/title="Financeiro" title="Financeiro"/g, 'title="Financeiro"');
    code = code.replace(/title="Talhões" title="Talhões"/g, 'title="Talhões"');
    
    fs.writeFileSync('apps/mobile/mobile_app/' + file, code);
}
console.log('Fixed TS17001 manually');
