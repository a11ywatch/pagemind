import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { wsChromeEndpointurl } from "@app/config/chrome";

const createPuppeteerFactory = () => ({
  async create() {
    try {
      return await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
        ignoreHTTPSErrors: true,
      });
    } catch (e) {
      console.error(e);
    }
  },
  async destroy(page: Page, browser: Browser) {
    try {
      await page?.close();
      await browser.disconnect();
    } catch (e) {
      console.error(e);
    }
  },
});

export function createPuppeteerPool() {
  return createPuppeteerFactory();
}

export { wsChromeEndpointurl };
