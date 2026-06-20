const fs = require('fs');
const files = ['AgroOptionsModal.js', 'EntitySelectorModal.js', 'FriendlyModal.js', 'LibraryPickerModal.js', 'OnboardingTour.js'].map(f => 'apps/mobile/mobile_app/src/components/common/' + f);
files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/import\s*\{([^}]*)\}\s*from\s*'react-native';/, "import { StyleSheet, $1 } from 'react-native';");
    fs.writeFileSync(f, c);
    console.log('Added StyleSheet to', f);
});
