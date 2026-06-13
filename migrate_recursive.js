const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const dir = path.join(__dirname, 'apps', 'mobile', 'mobile_app', 'src', 'screens');
const files = walkSync(dir).filter(f => f.endsWith('.js'));

let successCount = 0;

for (const filePath of files) {
    const file = path.basename(filePath);
    
    // Skip already manually migrated or skipped
    if (['SettingsScreen.js', 'HomeScreen.js', 'LoginScreen.js'].includes(file)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Identify if it still uses LinearGradient as header
    if (content.includes('LinearGradient') && content.includes('styles.header') && !content.includes('ScreenLayout')) {
        
        let titleMatch = content.match(/<Text style=\{styles\.headerTitle\}>([^<]+)<\/Text>/) 
                      || content.match(/<Text style=\{styles\.title\}>([^<]+)<\/Text>/);
        let title = titleMatch ? titleMatch[1] : file.replace('Screen.js', '');

        const lgStart = content.indexOf('<LinearGradient');
        let lgEnd = content.indexOf('</LinearGradient>');
        
        if (lgStart !== -1 && lgEnd !== -1) {
            lgEnd += '</LinearGradient>'.length;
            
            const beforeLG = content.substring(0, lgStart);
            const afterLG = content.substring(lgEnd);
            
            let newContent = beforeLG + afterLG;
            
            const returnIdx = newContent.indexOf('return (');
            if (returnIdx !== -1) {
                const viewStart = newContent.indexOf('<View', returnIdx);
                const kAViewStart = newContent.indexOf('<KeyboardAvoidingView', returnIdx);
                const safeViewStart = newContent.indexOf('<SafeAreaView', returnIdx);
                
                let mainTagStart = Math.min(
                    viewStart !== -1 ? viewStart : Infinity,
                    kAViewStart !== -1 ? kAViewStart : Infinity,
                    safeViewStart !== -1 ? safeViewStart : Infinity
                );
                
                if (mainTagStart !== Infinity) {
                    const tagEnd = newContent.indexOf('>', mainTagStart);
                    
                    const isScrollable = newContent.includes('<ScrollView');
                    let newMainTag = `<ScreenLayout title="${title}" onBack={() => navigation.goBack()} ${isScrollable ? 'scrollable' : ''}>`;
                    
                    newContent = newContent.substring(0, mainTagStart) + newMainTag + newContent.substring(tagEnd + 1);
                    
                    const lastViewClose = newContent.lastIndexOf('</View>');
                    const lastKAVClose = newContent.lastIndexOf('</KeyboardAvoidingView>');
                    const lastSafeClose = newContent.lastIndexOf('</SafeAreaView>');
                    
                    let mainTagClose = Math.max(lastViewClose, lastKAVClose, lastSafeClose);
                    if (mainTagClose !== -1) {
                        const closeTagLen = newContent.substring(mainTagClose).indexOf('>') + 1;
                        newContent = newContent.substring(0, mainTagClose) + '</ScreenLayout>' + newContent.substring(mainTagClose + closeTagLen);
                    }
                    
                    if (isScrollable) {
                        newContent = newContent.replace(/<ScrollView[^>]*>/, '').replace(/<\/ScrollView>/, '');
                    }
                    
                    // Determine relative path to layout component
                    const depth = filePath.replace(dir, '').split(path.sep).length - 1;
                    const prefix = depth === 0 ? '../' : '../'.repeat(depth + 1);
                    
                    newContent = `import ScreenLayout from '${prefix}components/layout/ScreenLayout';\n` + newContent;
                    
                    fs.writeFileSync(filePath, newContent, 'utf8');
                    successCount++;
                    console.log('Migrado Recursivamente:', filePath.replace(dir, ''));
                }
            }
        }
    }
}

console.log('Total migrado recursivamente com sucesso:', successCount);
