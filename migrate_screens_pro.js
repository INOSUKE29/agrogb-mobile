const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps', 'mobile', 'mobile_app', 'src', 'screens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

let successCount = 0;

for (const file of files) {
    if (['SettingsScreen.js', 'HomeScreen.js', 'LoginScreen.js'].includes(file)) continue;

    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Identifica se a tela tem LinearGradient como header
    if (content.includes('LinearGradient') && content.includes('styles.header') && !content.includes('ScreenLayout')) {
        
        // 1. Extrair o Título do Cabeçalho
        let titleMatch = content.match(/<Text style=\{styles\.headerTitle\}>([^<]+)<\/Text>/) 
                      || content.match(/<Text style=\{styles\.title\}>([^<]+)<\/Text>/);
        let title = titleMatch ? titleMatch[1] : file.replace('Screen.js', '');

        // 2. Localizar os limites do LinearGradient
        const lgStart = content.indexOf('<LinearGradient');
        let lgEnd = content.indexOf('</LinearGradient>');
        
        if (lgStart !== -1 && lgEnd !== -1) {
            lgEnd += '</LinearGradient>'.length;
            
            // Remove o LinearGradient inteiro
            const beforeLG = content.substring(0, lgStart);
            const afterLG = content.substring(lgEnd);
            
            // Reconstruir o componente. A maioria começa com:
            // return (
            //   <View style={styles.container}>
            
            let newContent = beforeLG + afterLG;
            
            // Injetar o ScreenLayout no lugar do View container principal
            // Tem que achar o `return (`
            const returnIdx = newContent.indexOf('return (');
            if (returnIdx !== -1) {
                // Procura o proximo <View ou <KeyboardAvoidingView
                const viewStart = newContent.indexOf('<View', returnIdx);
                const kAViewStart = newContent.indexOf('<KeyboardAvoidingView', returnIdx);
                const safeViewStart = newContent.indexOf('<SafeAreaView', returnIdx);
                
                // Encontra a tag principal de abertura
                let mainTagStart = Math.min(
                    viewStart !== -1 ? viewStart : Infinity,
                    kAViewStart !== -1 ? kAViewStart : Infinity,
                    safeViewStart !== -1 ? safeViewStart : Infinity
                );
                
                if (mainTagStart !== Infinity) {
                    const tagEnd = newContent.indexOf('>', mainTagStart);
                    
                    // Verifica se tem scrollable
                    const isScrollable = newContent.includes('<ScrollView');
                    let newMainTag = `<ScreenLayout title="${title}" onBack={() => navigation.goBack()} ${isScrollable ? 'scrollable' : ''}>`;
                    
                    newContent = newContent.substring(0, mainTagStart) + newMainTag + newContent.substring(tagEnd + 1);
                    
                    // Precisamos trocar o fechamento. Como é arriscado substituir o ÚLTIMO </View>,
                    // vamos procurar do final para o começo.
                    const lastViewClose = newContent.lastIndexOf('</View>');
                    const lastKAVClose = newContent.lastIndexOf('</KeyboardAvoidingView>');
                    const lastSafeClose = newContent.lastIndexOf('</SafeAreaView>');
                    
                    let mainTagClose = Math.max(lastViewClose, lastKAVClose, lastSafeClose);
                    if (mainTagClose !== -1) {
                        const closeTagLen = newContent.substring(mainTagClose).indexOf('>') + 1;
                        newContent = newContent.substring(0, mainTagClose) + '</ScreenLayout>' + newContent.substring(mainTagClose + closeTagLen);
                    }
                    
                    // Remover ScrollView redundante (se for simples)
                    if (isScrollable) {
                        newContent = newContent.replace(/<ScrollView[^>]*>/, '').replace(/<\/ScrollView>/, '');
                    }
                    
                    // Injetar import
                    newContent = "import ScreenLayout from '../components/layout/ScreenLayout';\n" + newContent;
                    
                    // Salvar
                    fs.writeFileSync(filePath, newContent, 'utf8');
                    successCount++;
                    console.log('Migrado:', file);
                }
            }
        }
    }
}

console.log('Total migrado com sucesso:', successCount);
