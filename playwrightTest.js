const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    recordVideo: {
      dir: './recordings/',
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  await page.goto('https://tasmiachow.vercel.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Smoothly scroll through hero
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalScrolled = 0;
      const targetHeight = 3000;
      const distance = 50;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalScrolled += distance;
        if (totalScrolled >= targetHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 30);
    });
  });

  await page.waitForTimeout(1000);

  // 2. Scroll About into view
  await page.evaluate(() => {
    document.querySelector('.about__stage').scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(3000); // wait for bubble entrance + floats to start

  // 3. Click the mission bubble via JS dispatch
  await page.evaluate(() => {
    document.querySelectorAll('.bubble')[1].click();
  });
  await page.waitForTimeout(4000);

  // 4. Scroll to experience
  await page.evaluate(() => {
    document.querySelector('#experience').scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(1500);

  // 5. Scroll through experience section
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(2000);

  // Close safely
  await Promise.race([
    context.close(),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);
  await browser.close();
  console.log('Recording saved!');
})();