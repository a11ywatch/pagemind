import type { Browser, Page } from "puppeteer";
import { createPuppeteerPool } from "./create-puppeteer-pool";

const puppeteerPool = createPuppeteerPool();

const puppetPool = {
  acquire: async () => {
    try {
      return await puppeteerPool.acquire();
    } catch (e) {
      console.error(e, { type: "error" });
      return null;
    }
  },
  clean: async (page: Page, browser: Browser, lighthouse?: boolean) => {
    try {
      await page.close();
      if (lighthouse) {
        await puppeteerPool.destroy(browser);
      } else {
        await puppeteerPool.release(browser);
      }
    } catch (e) {
      console.error(e);
    }
  },
};

export { puppetPool };
