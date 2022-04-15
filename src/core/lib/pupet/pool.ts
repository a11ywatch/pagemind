import type { Browser, Page } from "puppeteer";
import { createPuppeteerPool } from "./create-puppeteer-pool";

const puppeteerPool = createPuppeteerPool();

const puppetPool = {
  acquire: async () => {
    try {
      return await puppeteerPool.create();
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  clean: async (page: Page, browser: Browser) => {
    try {
      return await puppeteerPool.destroy(page, browser);
    } catch (e) {
      console.error(e);
    }
  },
};

export { puppetPool };
