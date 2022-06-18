import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { wsChromeEndpointurl, getWsEndPoint } from "@app/config/chrome";

const createPuppeteerFactory = () => ({
  async create(): Promise<Browser> {
    let browser;

    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
        ignoreHTTPSErrors: true,
      });
    } catch (e) {
      console.error(e);
    }

    // retry and wait for ws endpoint
    if (!browser) {
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

export { wsChromeEndpointurl };
