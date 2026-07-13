const fs = require('fs');

const screens = [
    'apps/mobile/mobile_app/src/screens/CadastroScreen.js',
    'apps/mobile/mobile_app/src/screens/ComprasScreen.js',
    'apps/mobile/mobile_app/src/screens/VendasScreen.js',
    'apps/mobile/mobile_app/src/screens/ColheitaScreen.js'
];

screens.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log(`Skipping ${file}, not found.`);
        return;
    }
    
    let content = fs.readFileSync(file, 'utf8');

    // Make sure SafeAreaView, KeyboardAvoidingView, Platform are imported
    if (!content.includes('KeyboardAvoidingView')) {
        content = content.replace(/import {([^}]+)} from 'react-native';/, (match, p1) => {
            let newImports = p1;
            if (!newImports.includes('KeyboardAvoidingView')) newImports += ', KeyboardAvoidingView';
            if (!newImports.includes('SafeAreaView')) newImports += ', SafeAreaView';
            if (!newImports.includes('Platform')) newImports += ', Platform';
            return `import {${newImports}} from 'react-native';`;
        });
    }

    // Now let's wrap the main return if it starts with <View style={[styles.container
    if (content.includes('<View style={[styles.container') && !content.includes('<KeyboardAvoidingView')) {
        // Replace the main wrapper
        content = content.replace(/<View style=\{\[styles\.container([^>]+)>\s*<StatusBar/, '<SafeAreaView style={{ flex: 1, backgroundColor: isDark ? activeColors?.bg || "#0F172A" : "#F3F4F6" }}>\n            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>\n            <View style={[styles.container$1>\n                <StatusBar');
        
        content = content.replace(/<View style=\{\[styles\.container([^>]+)>/, '<SafeAreaView style={{ flex: 1, backgroundColor: activeColors?.bg || "#0F172A" }}>\n            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>\n            <View style={[styles.container$1>');
        
        // At the very end of the file, right before the styles or last closing bracket?
        // Let's replace the last </View> before styles.create or export default with </View></KeyboardAvoidingView></SafeAreaView>
        // Since it's hard to target the EXACT closing View, it's better to do this manually or let the script try:
        const parts = content.split('const styles = StyleSheet.create({');
        if (parts.length === 2) {
            let codePart = parts[0];
            let lastViewIndex = codePart.lastIndexOf('</View>');
            if (lastViewIndex !== -1) {
                codePart = codePart.substring(0, lastViewIndex) + '</View>\n            </KeyboardAvoidingView>\n        </SafeAreaView>' + codePart.substring(lastViewIndex + 7);
                content = codePart + 'const styles = StyleSheet.create({' + parts[1];
            }
        }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Patched ${file}`);
});
