import type { Page } from "puppeteer";
import { createPuppeteerPool } from "./create-puppeteer-pool";

const puppeteerPool = createPuppeteerPool();

const puppetPool = {
  acquire: async () => {
    try {
      return await puppeteerPool.create();
    } catch (e) {
      console.error(e, { type: "error" });
      return null;
    }
  },
  clean: async (page: Page) => {
    try {
      return await puppeteerPool.destroy(page);
    } catch (e) {
      console.error(e);
    }
  },
};

export { puppetPool };
