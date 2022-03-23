import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import type { Page } from "puppeteer";
import { wsChromeEndpointurl } from "@app/config/chrome";

puppeteer.use(StealthPlugin()).use(AdblockerPlugin({ blockTrackers: true }));

const createPuppeteerFactory = () => ({
  async create() {
    try {
      return await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
      });
    } catch (e) {
      console.error(e);
    }
  },
  async destroy(page: Page) {
    try {
      return await page?.close();
    } catch (e) {
      console.error(e);
    }
  },
});

export function createPuppeteerPool() {
  return createPuppeteerFactory();
}

export { wsChromeEndpointurl };
