const fs = require('fs');
const glob = require('glob');

glob('apps/mobile/mobile_app/src/screens/**/*.js', (err, files) => {
    if(err) {
        console.error(err);
        return;
    }
    
    let migrated = 0;
    
    for(let file of files) {
        // Skip LoginScreen
        if(file.includes('LoginScreen')) continue;
        
        let code = fs.readFileSync(file, 'utf8');
        
        if(code.includes('<SafeAreaView')) {
            // Very simple exact replacement
            code = code.replace(/<SafeAreaView style=\{styles\.container\}>/g, '<ScreenLayout showBack={true} scrollable={false} noPadding={true} headerContent={null}>');
            code = code.replace(/<SafeAreaView style=\{styles\.containerLight\}>/g, '<ScreenLayout showBack={true} scrollable={false} noPadding={true} headerContent={null}>');
            code = code.replace(/<SafeAreaView style=\{styles\.containerBg\}>/g, '<ScreenLayout showBack={true} scrollable={false} noPadding={true} headerContent={null}>');
            code = code.replace(/<SafeAreaView[^>]*>/g, '<ScreenLayout showBack={true} scrollable={false} noPadding={true} headerContent={null}>');
            code = code.replace(/<\/SafeAreaView>/g, '</ScreenLayout>');
            
            // Add import if missing
            if(!code.includes('ScreenLayout') && code.includes('react')) {
                code = "import ScreenLayout from '../components/layout/ScreenLayout';\n" + code;
            }
            
            fs.writeFileSync(file, code);
            migrated++;
        }
    }
    console.log(`Safely migrated ${migrated} files`);
});
