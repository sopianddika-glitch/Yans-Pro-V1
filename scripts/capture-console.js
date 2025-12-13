const puppeteer = require('puppeteer');

(async () => {
  const url = process.env.PREVIEW_URL || 'http://localhost:4174';
  console.log('Launching headless Chromium (puppeteer)...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', async msg => {
    try {
      const args = msg.args();
      const values = [];
      for (let i = 0; i < args.length; ++i) {
        try { values.push(await args[i].jsonValue()); } catch (e) { values.push(String(args[i])); }
      }
      console.log(`PAGE CONSOLE [${msg.type()}]`, ...values);
    } catch (e) {
      console.log('PAGE CONSOLE [err]', e.message);
    }
  });

  page.on('pageerror', err => {
    console.error('PAGE ERROR', err && err.stack ? err.stack : err.toString());
  });

  page.on('requestfailed', req => {
    console.log('REQUEST FAILED', req.url(), req.failure() && req.failure().errorText);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  } catch (e) {
    console.error('Failed to load page:', e.message);
  }

  console.log(`Listening for console messages from ${url} for 180 seconds...`);
  // Keep running for 180s to capture logs, then exit
  await new Promise(resolve => setTimeout(resolve, 180000));

  console.log('Closing browser and exiting.');
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Fatal error in capture script:', err);
  process.exit(1);
});
