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
    
    // Ignore manually crafted files
    if (['SettingsScreen.js', 'HomeScreen.js', 'LoginScreen.js', 'SyncScreen.js'].includes(file)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // If it has SafeAreaView at the root and NO ScreenLayout
    if (content.includes('<SafeAreaView') && !content.includes('<ScreenLayout')) {
        
        let titleMatch = content.match(/<Text style=\{styles\.headerTitle\}>([^<]+)<\/Text>/) 
                      || content.match(/<Text style=\{styles\.title\}>([^<]+)<\/Text>/);
        let title = titleMatch ? titleMatch[1] : file.replace('Screen.js', '');

        const safeStart = content.indexOf('<SafeAreaView');
        let safeEnd = content.indexOf('</SafeAreaView>');
        
        if (safeStart !== -1 && safeEnd !== -1) {
            
            const isScrollable = content.includes('<ScrollView');
            let newMainTag = `<ScreenLayout title="${title}" onBack={() => navigation?.goBack?.()} ${isScrollable ? 'scrollable' : ''}>`;
            
            const tagEnd = content.indexOf('>', safeStart);
            content = content.substring(0, safeStart) + newMainTag + content.substring(tagEnd + 1);
            
            safeEnd = content.lastIndexOf('</SafeAreaView>');
            if (safeEnd !== -1) {
                content = content.substring(0, safeEnd) + '</ScreenLayout>' + content.substring(safeEnd + '</SafeAreaView>'.length);
            }
            
            if (isScrollable) {
                content = content.replace(/<ScrollView[^>]*>/, '').replace(/<\/ScrollView>/, '');
            }
            
            // Remove custom headers if they exist inside the old SafeAreaView
            content = content.replace(/<View style=\{styles\.header\}>[\s\S]*?<\/View>/, '');
            
            // Determine relative path to layout component
            const depth = filePath.replace(dir, '').split(path.sep).length - 1;
            const prefix = depth === 0 ? '../' : '../'.repeat(depth + 1);
            
            content = `import ScreenLayout from '${prefix}components/layout/ScreenLayout';\n` + content;
            
            fs.writeFileSync(filePath, content, 'utf8');
            successCount++;
            console.log('SafeAreaView Migrado:', filePath.replace(dir, ''));
        }
    }
}

console.log('Total de SafeAreaViews migrados:', successCount);
