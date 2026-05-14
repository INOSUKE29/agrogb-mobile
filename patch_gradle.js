const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'android', 'app', 'build.gradle');

if (fs.existsSync(targetPath)) {
    let content = fs.readFileSync(targetPath, 'utf8');
    const originalContent = content;

    // Force release to use debug signing configuration for easy testing/installation
    const buildTypesReplacement = `        release {
            // Para testes, usar a assinatura debug para gerar um APK instalável
            signingConfig signingConfigs.debug
            minifyEnabled false
            shrinkResources false
            debuggable false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }`;

    // Replace the release buildType block
    // This regex specifically targets the "release {" block inside buildTypes
    content = content.replace(/release\s*{[\s\S]*?signingConfig.*?proguardFiles.*?}/, buildTypesReplacement);

    if (content !== originalContent) {
        fs.writeFileSync(targetPath, content, 'utf8');
        console.log('✅ build.gradle successfully patched for stable release build!');
        
        // Verification of key changes
        if (content.includes('signingConfig signingConfigs.debug')) {
            console.log('✅ Verification passed: Correct signing config applied.');
        } else {
            console.warn('⚠️ Verification warning: signingConfigs.debug not found after patch.');
        }
    } else {
        console.log('ℹ️ No changes needed or patterns not found in build.gradle.');
    }
} else {
    console.log('❌ build.gradle not found at ' + targetPath);
    process.exit(1);
}
