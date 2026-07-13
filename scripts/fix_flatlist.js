const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const targetRegex = /keyExtractor=\{\s*\(([\w]+)\)\s*=\s*initialNumToRender=\{8\}\s*maxToRenderPerBatch=\{10\}\s*windowSize=\{5\}\s*removeClippedSubviews=\{true\}\s*>\s*(.*?)\}/g;
const targetRegex2 = /keyExtractor=\{\s*([\w]+)\s*=\s*initialNumToRender=\{8\}\s*maxToRenderPerBatch=\{10\}\s*windowSize=\{5\}\s*removeClippedSubviews=\{true\}\s*>\s*(.*?)\}/g;

let count = 0;

walkDir(path.join(__dirname, 'apps/mobile/mobile_app/src/screens'), function(filePath) {
    if (filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(targetRegex, (match, p1, p2) => {
            return `keyExtractor={(${p1}) => ${p2}}\n                    initialNumToRender={8}\n                    maxToRenderPerBatch={10}\n                    windowSize={5}\n                    removeClippedSubviews={true}`;
        });
        newContent = newContent.replace(targetRegex2, (match, p1, p2) => {
            return `keyExtractor={${p1} => ${p2}}\n                    initialNumToRender={8}\n                    maxToRenderPerBatch={10}\n                    windowSize={5}\n                    removeClippedSubviews={true}`;
        });
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Fixed', filePath);
            count++;
        }
    }
});

console.log(`Fixed ${count} files.`);
