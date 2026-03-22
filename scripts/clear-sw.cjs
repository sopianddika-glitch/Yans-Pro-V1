const puppeteer = require('puppeteer');

(async () => {
  const url = process.env.PREVIEW_URL || 'http://localhost:5174';
  console.log('Launching headless Chromium to clear Service Workers...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  } catch (e) {
    console.error('Failed to load page:', e.message);
  }

  const regs = await page.evaluate(async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        try { await r.unregister(); } catch (e) { /* ignore */ }
      }
      return regs.length;
    } catch (e) { return 0; }
  });

  console.log(`Unregistered ${regs} service worker(s). Performing hard reload.`);
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
