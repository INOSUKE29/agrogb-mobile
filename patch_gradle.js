const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'android', 'app', 'build.gradle');

if (fs.existsSync(targetPath)) {
    let content = fs.readFileSync(targetPath, 'utf8');
    const originalContent = content;

    const signingConfigsReplacement = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }`;

    const buildTypesReplacement = `        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            shrinkResources false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }`;

    // 1. Replace the entire signingConfigs block
    // This regex matches "signingConfigs {" followed by any content including a "release {" block, until the closing brace of signingConfigs.
    content = content.replace(/signingConfigs\s*{[\s\S]*?release\s*{[\s\S]*?}[\s\S]*?}/, signingConfigsReplacement);
    
    // 2. Replace the release buildType block
    // This regex specifically targets the "release {" block inside buildTypes that contains signingConfig and proguardFiles.
    content = content.replace(/release\s*{[\s\S]*?signingConfig.*?proguardFiles.*?}/, buildTypesReplacement);

    if (content !== originalContent) {
        fs.writeFileSync(targetPath, content, 'utf8');
        console.log('✅ build.gradle successfully patched!');
        
        // Verification of key changes
        if (content.includes('MYAPP_UPLOAD_STORE_FILE') && content.includes('signingConfig signingConfigs.release')) {
            console.log('✅ Verification passed: Correct signing properties and config location found.');
        } else {
            console.warn('⚠️ Verification warning: Some expected strings are missing after patch.');
        }
    } else {
        console.log('ℹ️ No changes needed or patterns not found in build.gradle.');
    }
} else {
    console.log('❌ build.gradle not found at ' + targetPath);
    process.exit(1); // Exit with error if file not found in CI
}
