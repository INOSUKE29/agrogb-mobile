const fs = require('fs');

try {
    const report = JSON.parse(fs.readFileSync('eslint_report.json', 'utf8'));
    let errorCount = 0;
    let warningCount = 0;
    const fileStats = [];

    report.forEach(file => {
        if (file.errorCount > 0 || file.warningCount > 0) {
            errorCount += file.errorCount;
            warningCount += file.warningCount;
            fileStats.push({
                path: file.filePath.split('mobile_app')[1], // Relative-ish
                errors: file.errorCount,
                warnings: file.warningCount,
                messages: file.messages.map(m => `[${m.ruleId}] ${m.message}`).slice(0, 3) // Top 3
            });
        }
    });

    console.log(`TOTAL ERRORS: ${errorCount}`);
    console.log(`TOTAL WARNINGS: ${warningCount}`);
    console.log('--- TOP OFFENDERS ---');
    fileStats.sort((a, b) => b.errors - a.errors).slice(0, 10).forEach(f => {
        console.log(`${f.path}: ${f.errors} err, ${f.warnings} warn`);
        f.messages.forEach(m => console.log(`   - ${m}`));
    });

} catch (e) {
    console.error("Error parsing report:", e);
}
