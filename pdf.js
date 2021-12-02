const puppeteer = require('puppeteer');
const { spawn } = require("child_process");

async function hasNextSlide(page) {
  return page.evaluate(_ => !Reveal.isLastSlide() || Reveal.availableFragments().next);
}

async function nextSlide(page) {
  return page.evaluate(_ => Reveal.next());
}

async function currentSlide(page) {
  return page.evaluate(_ => {
    const indices = Reveal.getIndices();
    const id = Reveal.getCurrentSlide().getAttribute('id');
    return typeof id === 'string' && id.length
      ? '/' + id
      : '/' + indices.h + (indices.v > 0 ? '/' + indices.v : '');
  });
}

function delay(time) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time)
  });
}

async function screenshot(page, index) {
  await page.screenshot({
    omitBackground: false,
    fullPage: true,
    path: `slide-${index}.png`,
  });
}

function run(command, args) {

}

async function convertToPdf(index, output) {
  console.log(` ✅ ${index + 1} slides generated`);
  console.log(`Exporting ${output}`);
  let args = [ '-monitor' ];
  for (let current = 0; current <= index; current++) {
    args.push(`slide-${current}.png`);
  }
  args.push(output);
  spawn('convert', args, { stdio: 'inherit' });
}

async function printToPdf(page, output, timeout) {
  await page.waitForSelector('.print-pdf', {visible: true, timeout: timeout });
  await page.pdf({ path: output, format: 'A4' });
}

async function exportToPdf(page, output) {
  const spinner = [ '❤️ ', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍' ];
  let index = 0;
  await screenshot(page, index);
  while (await hasNextSlide(page)) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(" " + spinner[index % spinner.length] + " Generating slide #" + index + ": " + await currentSlide(page));
    index++;
    await nextSlide(page);
    await delay(1000);
    await screenshot(page, index);
  }
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  await convertToPdf(index, output);
}

(async() => {
  const type = process.argv[2]
  const url = process.argv[3];
  const output = process.argv[4];
  const timeout = process.argv[5];

  console.log(`Processing ${url} to ${output} with timeout set to ${timeout} ms`);
  // '--no-sandbox' is set to allow running on Docker without '--cap-add SYS_ADMIN'
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
    ],
  });
  const [page] = await browser.pages();
  await page.setViewport({ width: 1920, height: 1080 });
  page.setDefaultNavigationTimeout(0);
  await page.setCacheEnabled(false);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: timeout });
  if (type === 'exportToPdf') {
    await exportToPdf(page, output);
  } else if (type === 'printToPdf') {
    await printToPdf(page, output, timeout);
  }
  await browser.close();
})();
