const fs = require('fs');

function fixFile(path, lineNum, correctLine) {
    let code = fs.readFileSync(path, 'utf8');
    let lines = code.split('\n');
    lines[lineNum - 1] = correctLine;
    fs.writeFileSync(path, lines.join('\n'));
}

fixFile('apps/mobile/mobile_app/src/screens/EquipesScreen.js', 141, '        <ScreenLayout title="Equipes" onBack={() => navigation.goBack()} scrollable noPadding={true}>');
fixFile('apps/mobile/mobile_app/src/screens/EstoqueScreen.js', 192, '        <ScreenLayout title="Estoque" onBack={() => navigation.goBack()} scrollable noPadding={true}>');
fixFile('apps/mobile/mobile_app/src/screens/FinanceiroScreen.js', 208, '        <ScreenLayout title="Financeiro" onBack={() => navigation.goBack()} scrollable noPadding={true}>');
fixFile('apps/mobile/mobile_app/src/screens/TalhoesScreen.js', 132, '        <ScreenLayout title="Talhões" onBack={() => navigation.goBack()} scrollable noPadding={true}>');

console.log('Fixed exactly!');
