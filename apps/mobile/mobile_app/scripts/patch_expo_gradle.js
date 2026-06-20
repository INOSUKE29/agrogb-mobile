const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix for "Could not get unknown property 'release' for SoftwareComponent container"
    // We comment out the 'from components.release' line since we don't publish expo-modules-core
    if (content.includes('from components.release')) {
        content = content.replace(/from components\.release/g, '// from components.release');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Patched ExpoModulesCorePlugin.gradle to prevent SoftwareComponent release error.');
    } else {
        console.log('⚡ ExpoModulesCorePlugin.gradle already patched or not affected.');
    }
} else {
    console.log('⚠️ ExpoModulesCorePlugin.gradle not found. Skipping patch.');
}
