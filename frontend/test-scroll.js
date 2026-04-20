import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173');
    
    // Evaluate the scroll offset that framer-motion reads.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(1000);
    
    // Check if heroText has opacity 0
    const heroOpacity = await page.evaluate(() => {
         const div = document.querySelector('.home__header')?.parentElement;
         if (!div) return "not found";
         return window.getComputedStyle(div).opacity;
    });
    console.log("Hero Text Parent Opacity: ", heroOpacity);

    // take screenshot
    await page.screenshot({ path: 'screenshot_scroll.png' });
    await browser.close();
})();
