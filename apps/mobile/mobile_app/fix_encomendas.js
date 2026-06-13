const fs = require('fs');
let code = fs.readFileSync('src/screens/EncomendasScreen.js', 'utf8');

// Fix the corrupted tag
code = code.replace('{active && <ScreenLayout title="ENCOMENDAS" onBack={() => navigation.goBack()} scrollable>}', '{active && <View style={styles.filterDot} />}');

// Remove the top-level <View style={styles.webContainer}> down to SafeAreaView
const startView = code.indexOf('<View style={styles.webContainer}>');
const endSafeArea = code.indexOf('>', code.indexOf('<SafeAreaView')) + 1;

if(startView !== -1 && endSafeArea !== -1) {
    const blockToReplace = code.substring(startView, endSafeArea);
    code = code.replace(blockToReplace, '<ScreenLayout title="Encomendas" onBack={() => navigation.goBack()} scrollable noPadding={true}>');
    code = code.replace('</SafeAreaView>', '');
}

// Fix the syntax error in EncomendasScreen
code = code.replace(
    ') : (\n                \n                    {filteredData.map(item => {',
    ') : (\n                <View>\n                    {filteredData.map(item => {'
);
code = code.replace(
    '                        </TouchableOpacity>\n                    ); \n                })}\n                \n            </ScreenLayout>',
    '                        </TouchableOpacity>\n                    ); \n                })}\n                </View>\n            </ScreenLayout>'
);

fs.writeFileSync('src/screens/EncomendasScreen.js', code);
console.log('Fixed EncomendasScreen.js');
