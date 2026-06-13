const fs = require('fs');
const files = [
    'src/screens/EquipesScreen.js',
    'src/screens/EstoqueScreen.js',
    'src/screens/FinanceiroScreen.js',
    'src/screens/TalhoesScreen.js'
];
for(let file of files) {
    let code = fs.readFileSync('apps/mobile/mobile_app/' + file, 'utf8');
    code = code.replace(/scrollable\s+scrollable/g, 'scrollable');
    code = code.replace(/noPadding=\{true\}\s+noPadding=\{true\}/g, 'noPadding={true}');
    code = code.replace(/title="[^"]*"\s+title="[^"]*"/g, match => match.split(' title=')[0]);
    fs.writeFileSync('apps/mobile/mobile_app/' + file, code);
}
console.log('Fixed TS17001');
