const fs = require('fs');

let code = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');

code = code.replace(/import \{ LinearGradient \} from 'expo-linear-gradient';/g, '');
code = code.replace("import SidebarDrawer from '../components/SidebarDrawer';", "import SidebarDrawer from '../components/SidebarDrawer';\nimport ScreenLayout from '../components/layout/ScreenLayout';");

const oldContainer = '<View style={[styles.container, { backgroundColor: THEME.bg }]}>';
if(code.includes(oldContainer)) {
    code = code.replace(oldContainer, '<ScreenLayout showBack={false} scrollable={false} noPadding={true} gradientColors={THEME.headerBg} headerContent={');
    code = code.replace('</LinearGradient>', '}>');
    code = code.replace('<LinearGradient colors={THEME.headerBg} style={styles.header}>', '');
    
    const lastView = code.lastIndexOf('</View>');
    code = code.substring(0, lastView) + '</ScreenLayout>' + code.substring(lastView + 7);
    
    code = code.replace('<RNStatusBar barStyle="light-content" backgroundColor={THEME.headerBg[0]} />', '');
    
    fs.writeFileSync('src/screens/HomeScreen.js', code);
    console.log('HomeScreen migrada com sucesso!');
} else {
    console.log('Container não encontrado em HomeScreen.js');
}

// ---------------- SettingsScreen ----------------
let setCode = fs.readFileSync('src/screens/SettingsScreen.js', 'utf8');
if(setCode.includes('<AppContainer>')) {
    setCode = setCode.replace(/import AppContainer from '\.\.\/components\/ui\/AppContainer';/g, "import ScreenLayout from '../components/layout/ScreenLayout';");
    setCode = setCode.replace(/import ScreenHeader from '\.\.\/components\/ui\/ScreenHeader';/g, "");
    
    setCode = setCode.replace('<AppContainer>', '<ScreenLayout title="Configurações & Painel" onBack={() => navigation.goBack()} scrollable noPadding>');
    setCode = setCode.replace('</AppContainer>', '</ScreenLayout>');
    
    // Remove the old ScreenHeader and ambient orbs
    setCode = setCode.replace(/<StatusBar barStyle="light-content".*\/>/g, '');
    setCode = setCode.replace(/<LinearGradient colors=\{.*\} style=\{StyleSheet.absoluteFill\} \/>/g, '');
    setCode = setCode.replace(/<View style=\{\[styles\.ambientOrb.*\]\} \/>/g, '');
    setCode = setCode.replace(/<ScreenHeader title="Configurações & Painel".*\/>/g, '');
    
    // Remove ScrollView wrapping since ScreenLayout is scrollable
    setCode = setCode.replace(/<ScrollView[^>]*>/, '');
    setCode = setCode.replace('</ScrollView>', '');
    
    fs.writeFileSync('src/screens/SettingsScreen.js', setCode);
    console.log('SettingsScreen migrada com sucesso!');
} else {
    console.log('Container não encontrado em SettingsScreen.js');
}
