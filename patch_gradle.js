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
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }`;

    const buildTypesReplacement = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig (project.hasProperty('MYAPP_RELEASE_STORE_FILE') ? signingConfigs.release : signingConfigs.debug)
            shrinkResources (findProperty('android.enableShrinkResourcesInReleaseBuilds')?.toBoolean() ?: false)
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }`;

    content = content.replace(/signingConfigs\s*{[\s\S]*?debug\s*{[\s\S]*?}[\s\S]*?}/, signingConfigsReplacement);
    content = content.replace(/release\s*{[\s\S]*?signingConfig signingConfigs\.debug[\s\S]*?}/, buildTypesReplacement);

    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('✅ build.gradle patched for release signing!');
} else {
    console.log('❌ build.gradle not found at ' + targetPath);
}
