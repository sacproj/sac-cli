const puppeteer = require('puppeteer');

(async() => {
const url = process.argv[2];
const output = process.argv[3];
const timeout = process.argv[4];
console.log(`Processing ${url} to ${output}`);
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForSelector('.print-pdf', {visible: true, timeout: timeout })
await page.pdf({ path: output, format: 'A4' });
await browser.close();
})();
