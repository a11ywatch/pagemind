import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { getWsEndPoint } from "../../../config/chrome";

// retry and wait for ws endpoint
const getConnnection = async (retry?: boolean): Promise<puppeteer.Browser> => {
  const browserWSEndpoint = await (retry
    ? getWsEndPoint(false, true)
    : getWsEndPoint());

  try {
    return await puppeteer.connect({
      browserWSEndpoint,
      ignoreHTTPSErrors: true,
    });
  } catch (e) {
    // retry connection once
    if (!retry) {
      return await getConnnection(true);
    } else {
      console.error(e);
    }
  }
};

const createPuppeteerFactory = () => ({
  acquire: getConnnection,
  async clean(page: Page, browser: Browser) {
    if (!page?.isClosed()) {
      try {
        await page.close();
      } catch (e) {
        console.error(e);
      }
    }
    if (browser?.isConnected()) {
      browser.disconnect();
    }
  },
});

export const puppetPool = createPuppeteerFactory();
