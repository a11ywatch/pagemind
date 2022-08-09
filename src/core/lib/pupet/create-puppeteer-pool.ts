import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { getWsEndPoint } from "@app/config/chrome";

const createPuppeteerFactory = () => ({
  async create(): Promise<Browser> {
    let browser;
    let browserWSEndpoint;

    try {
      browserWSEndpoint = await getWsEndPoint();
    } catch (e) {
      console.error(e);
    }

    try {
      browser = await puppeteer.connect({
        browserWSEndpoint,
        ignoreHTTPSErrors: true,
      });
    } catch (e) {
      console.error(e);
    }

    if (!browser) {
      // retry and wait for ws endpoint
      try {
        browserWSEndpoint = await getWsEndPoint(false, true);
      } catch (e) {
        console.error(e);
      }

      try {
        // reconnect to browser
        browser = await puppeteer.connect({
          browserWSEndpoint,
          ignoreHTTPSErrors: true,
        });
      } catch (e) {
        console.error(e);
      }
    }

    return browser;
  },
  async destroy(page: Page, browser: Browser) {
    try {
      if (!page?.isClosed()) {
        await page?.close({ runBeforeUnload: true });
      }
      if (browser?.isConnected()) {
        await browser?.disconnect();
      }
    } catch (e) {
      console.error(e);
    }
  },
});

export function createPuppeteerPool() {
  return createPuppeteerFactory();
}
