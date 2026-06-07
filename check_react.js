import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';

// Get Chrome path
let chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
try {
    chromePath = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve').toString().split('REG_SZ')[1].trim();
} catch (e) {
    // fallback
}

(async () => {
    console.log("Launching puppeteer...");
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: "new"
    });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`Browser Error: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        console.error(`Page Error: ${error.message}`);
    });

    console.log("Navigating to localhost:5173...");
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 });
        console.log("Page loaded.");
        const title = await page.title();
        console.log(`Title: ${title}`);
        
        const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML.substring(0, 500));
        console.log(`Root innerHTML (first 500 chars):\n${rootHtml}`);
    } catch (e) {
        console.error("Navigation failed:", e.message);
    }

    await browser.close();
})();
