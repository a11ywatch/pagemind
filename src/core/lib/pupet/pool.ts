import type { Browser, Page } from "puppeteer";
import { createPuppeteerPool } from "./create-puppeteer-pool";

const puppeteerPool = createPuppeteerPool();

const puppetPool = {
  acquire: async () => {
    return await puppeteerPool.create();
  },
  clean: async (page: Page, browser: Browser) => {
    return await puppeteerPool.destroy(page, browser);
  },
};

export { puppetPool };
