const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PAGES = [
  'index.html',
  'tarjetas-regalo.html',
  'tarjeta-regalo.html',
  'conocenos.html',
  'faq.html',
  'anam-cara-coruna.html'
];

const VIEWPORTS = [
  { name: 'iPhone SE (375px)', width: 375, height: 667 },
  { name: 'iPhone 14 (390px)', width: 390, height: 844 },
  { name: 'Android Pixel (412px)', width: 412, height: 915 },
  { name: 'Tablet Portrait (768px)', width: 768, height: 1024 },
  { name: 'Breakpoint Max (991px)', width: 991, height: 800 }
];

function createStaticServer(root) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };

  return http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(root, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end(`Not found: ${reqPath}`);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
}

async function runTests() {
  console.log('=== STARTING HTTP STATIC SERVER ===');
  const server = createStaticServer(path.resolve(__dirname, '../src/_site'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Server listening on ${baseUrl}\n`);

  console.log('=== RUNNING MOBILE NAVIGATION RESPONSIVE TESTS ===\n');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  let totalErrors = 0;

  for (const pageName of PAGES) {
    const pageUrl = `${baseUrl}/${pageName}`;
    console.log(`\nTesting Page: ${pageName}`);

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

      // 1. Verify nav__toggle button is visible on mobile
      const toggleState = await page.$eval('.nav__toggle', el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          display: style.display,
          visible: style.display !== 'none' && rect.width > 0 && rect.height > 0,
          ariaExpanded: el.getAttribute('aria-expanded')
        };
      });

      if (!toggleState.visible) {
        console.error(`  ❌ [${vp.name}] nav__toggle button is NOT visible! (display: ${toggleState.display})`);
        totalErrors++;
        continue;
      }

      // 2. Verify menu is initially hidden
      const initiallyHidden = await page.$eval('#primary-menu', el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none';
      });

      if (!initiallyHidden) {
        console.error(`  ❌ [${vp.name}] #primary-menu should be hidden initially!`);
        totalErrors++;
      }

      // 3. Click toggle button to open menu
      await page.click('.nav__toggle');

      // 4. Measure menu position and dimensions
      const metrics = await page.$eval('#primary-menu', el => {
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const header = document.querySelector('.header');
        const hr = header ? header.getBoundingClientRect() : { bottom: 0 };
        const bodyScrollWidth = document.documentElement.scrollWidth;

        return {
          display: style.display,
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          top: Math.round(r.top),
          headerBottom: Math.round(hr.bottom),
          windowWidth: window.innerWidth,
          scrollWidth: bodyScrollWidth,
          hasHorizontalOverflow: bodyScrollWidth > window.innerWidth
        };
      });

      // Assertions
      const isFullWidth = Math.abs(metrics.width - vp.width) <= 2;
      const isLeftAligned = Math.abs(metrics.left) <= 2;
      const isRightAligned = Math.abs(metrics.right - vp.width) <= 2;
      const isBelowHeader = Math.abs(metrics.top - metrics.headerBottom) <= 2;

      if (!isFullWidth || !isLeftAligned || !isRightAligned) {
        console.error(`  ❌ [${vp.name}] Menu NOT full-width responsive!`);
        console.error(`     Left: ${metrics.left}px (expected 0px)`);
        console.error(`     Right: ${metrics.right}px (expected ${vp.width}px)`);
        console.error(`     Width: ${metrics.width}px (expected ${vp.width}px)`);
        totalErrors++;
      } else {
        console.log(`  ✅ [${vp.name}] Menu spans full width (${metrics.width}px, left: ${metrics.left}px, right: ${metrics.right}px)`);
      }

      if (metrics.hasHorizontalOverflow) {
        console.error(`  ❌ [${vp.name}] Horizontal page overflow detected! (body: ${metrics.scrollWidth}px > window: ${metrics.windowWidth}px)`);
        totalErrors++;
      }

      // 5. Verify touch targets on links (min 44px)
      const linkHeights = await page.$$eval('#primary-menu .nav__link', links => {
        return links.map(l => ({
          text: l.textContent.trim(),
          height: Math.round(l.getBoundingClientRect().height)
        }));
      });

      const smallLinks = linkHeights.filter(l => l.height < 44);
      if (smallLinks.length > 0) {
        console.warn(`  ⚠️ [${vp.name}] Some links are below 44px height:`, smallLinks);
      }

      // 6. Click a link and verify menu closes
      await page.click('#primary-menu .nav__link');
      const closed = await page.$eval('#primary-menu', el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none';
      });

      if (!closed) {
        console.error(`  ❌ [${vp.name}] Menu did NOT close after clicking a nav link!`);
        totalErrors++;
      }
    }
  }

  await browser.close();
  server.close();
  console.log(`\n=== TESTS COMPLETE: ${totalErrors === 0 ? 'ALL PASSED 🎉' : totalErrors + ' ERRORS FOUND ❌'} ===\n`);
  process.exit(totalErrors === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
