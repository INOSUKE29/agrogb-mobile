const fs = require('fs');
const file = 'apps/mobile/mobile_app/src/screens/HomeScreen.js';
let code = fs.readFileSync(file, 'utf8');

const targetStart = 'gradientColors={THEME.headerBg} headerContent={';
const replacementStart = 'gradientColors={THEME.headerBg} headerContent={<>';
code = code.replace(targetStart, replacementStart);

const targetEnd = '                    </View>\n                )}\n            }>';
const replacementEnd = '                    </View>\n                )}\n            </>}>';
code = code.replace(targetEnd, replacementEnd);

fs.writeFileSync(file, code);
console.log('Fixed HomeScreen.js');
