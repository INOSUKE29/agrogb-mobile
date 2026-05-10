const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'android', 'app', 'build.gradle');

if (fs.existsSync(targetPath)) {
    let content = fs.readFileSync(targetPath, 'utf8');

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
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }`;

    // Target the entire signingConfigs block
    content = content.replace(/signingConfigs\s*{[\s\S]*?release\s*{[\s\S]*?}[\s\S]*?}/, signingConfigsReplacement);
    
    // Target the release buildType block
    content = content.replace(/release\s*{[\s\S]*?signingConfig.*?proguardFiles.*?}/, buildTypesReplacement);

    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('✅ build.gradle patched with MYAPP_UPLOAD_* properties and correct signingConfig location!');
} else {
    console.log('❌ build.gradle not found at ' + targetPath);
}
