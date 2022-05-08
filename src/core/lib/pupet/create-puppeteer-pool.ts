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
      try {
        const browserWSEndpoint = await getWsEndPoint();
        browser = await puppeteer.connect({
          browserWSEndpoint: browserWSEndpoint,
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
      await page?.close();
      await browser?.disconnect();
    } catch (e) {
      console.error(e);
    }
  },
});

export function createPuppeteerPool() {
  return createPuppeteerFactory();
}

export { wsChromeEndpointurl };
