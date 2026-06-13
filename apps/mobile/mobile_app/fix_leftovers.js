const fs = require('fs');
const path = require('path');

// 1. Fix SyncScreen.js
const syncPath = 'src/screens/SyncScreen.js';
if (fs.existsSync(syncPath)) {
    let code = fs.readFileSync(syncPath, 'utf8');
    // Remove StatusBar
    code = code.replace(/<StatusBar barStyle="light-content" translucent backgroundColor="transparent" \/>/g, '');
    
    // Replace the LinearGradient header with the ScreenLayout headerContent
    const startLG = code.indexOf("<LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>");
    if (startLG !== -1) {
        let afterLG = code.substring(startLG);
        let endLG = afterLG.indexOf('</LinearGradient>') + '</LinearGradient>'.length;
        let lgBlock = code.substring(startLG, startLG + endLG);
        
        code = code.replace(lgBlock, '');
        
        // Remove SafeAreaView from the extracted block
        lgBlock = lgBlock.replace(/<SafeAreaView>/g, '').replace(/<\/SafeAreaView>/g, '');
        // Remove LinearGradient wrapper
        lgBlock = lgBlock.replace(/<LinearGradient[^>]*>/, '').replace(/<\/LinearGradient>/, '');
        
        // Pass to ScreenLayout
        code = code.replace('<ScreenLayout title="CONFIGURAÇÕES" onBack={() => navigation.goBack()} scrollable>', 
            `<ScreenLayout title="Sincronização" onBack={() => navigation.goBack()} scrollable noPadding={false} headerContent={<>
                ${lgBlock}
            </>}>`);
            
        fs.writeFileSync(syncPath, code);
        console.log('Fixed SyncScreen.js');
    }
}

// Helper to fix absoluteFill screens
function fixAbsoluteFillScreen(filePath, title) {
    if (fs.existsSync(filePath)) {
        let code = fs.readFileSync(filePath, 'utf8');
        if (code.includes('StyleSheet.absoluteFill') && !code.includes('<ScreenLayout')) {
            code = `import ScreenLayout from '../components/layout/ScreenLayout';\n` + code;
            
            // Replaces root View with ScreenLayout
            code = code.replace(/<View style=\{styles\.container\}>/, `<ScreenLayout title="${title}" onBack={() => navigation.goBack()} scrollable noPadding>`);
            
            // Remove the LinearGradient
            code = code.replace(/<LinearGradient[^>]*style=\{StyleSheet\.absoluteFill\}[^>]*\/>/g, '');
            code = code.replace(/<LinearGradient[^>]*style=\{StyleSheet\.absoluteFill\}[^>]*>\s*<\/LinearGradient>/g, '');
            
            // Change the last </View> to </ScreenLayout>
            const lastIdx = code.lastIndexOf('</View>');
            code = code.substring(0, lastIdx) + '</ScreenLayout>' + code.substring(lastIdx + 7);
            
            fs.writeFileSync(filePath, code);
            console.log(`Fixed ${path.basename(filePath)}`);
        }
    }
}

fixAbsoluteFillScreen('src/screens/RecoverScreen.js', 'Recuperar Conta');
fixAbsoluteFillScreen('src/screens/ResetPasswordScreen.js', 'Redefinir Senha');
fixAbsoluteFillScreen('src/screens/VerifyCodeScreen.js', 'Verificar Código');
fixAbsoluteFillScreen('src/screens/EncomendasScreen.js', 'Encomendas');
