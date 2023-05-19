import type { Browser, BrowserContext, Page } from "playwright";

// clean the connection
export const clean = async (
  page?: Page | BrowserContext,
  _browser?: Browser
) => {
  if (page) {
    try {
      await page.close();
    } catch (e) {
      console.error(e);
    }
  }
};
