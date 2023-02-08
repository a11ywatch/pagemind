import type { Browser, Page } from "puppeteer";

// clean the connection
export const clean = async (page?: Page, browser?: Browser) => {
  if (page && !page.isClosed()) {
    try {
      await page.close();
    } catch (e) {
      console.error(e);
    }
  }
  if (browser && browser.isConnected()) {
    browser.disconnect();
  }
};
