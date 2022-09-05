import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { getWsEndPoint } from "../../../config/chrome";

// const browserPool = [];
// let counter = 0;

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
  async acquire(): Promise<Browser> {
    const browser = await getConnnection();

    return browser;
  },
  async clean(page: Page, browser: Browser) {
    try {
      if (!page?.isClosed()) {
        await page?.close();
      }
      if (browser?.isConnected()) {
        browser?.disconnect();
      }
    } catch (e) {
      console.error(e);
    }
  },
});

export const puppetPool = createPuppeteerFactory();
