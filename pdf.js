const puppeteer = require('puppeteer');
const { exec } = require("child_process");

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

function run(command) {
  return new Promise((done, failed) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        failed(err)
        return
      }
      done({ stdout, stderr })
    })
  })
}

async function exportPdf(index) {
  console.log(` ✅ ${index } slides generated`);
  console.log(`Exporting slides.pdf`);
  let slides = '';
  for (let current = 0; current <= index; current++) {
    slides = slides + ` slide-${current}.png`;
  }
  await run(`convert -monitor${slides} slides.pdf`);
}

(async() => {
  const url = process.argv[2];
  const output = process.argv[3];
  const timeout = process.argv[4];

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

  const spinner = [ '💚', '💛', '💙', '💜', '🧡' ];
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

  await browser.close();
  await exportPdf(index);
})();
