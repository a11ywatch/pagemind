import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { getWsEndPoint, wsChromeEndpointurl } from "../../../config/chrome";

// retry and wait for ws endpoint
const getConnnection = async (retry?: boolean): Promise<puppeteer.Browser> => {
  try {
    return await puppeteer.connect({
      browserWSEndpoint: wsChromeEndpointurl,
      ignoreHTTPSErrors: true,
    });
  } catch (e) {
    // retry connection once
    if (!retry) {
      await getWsEndPoint(false, true);
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
      browser?.disconnect();
    }
  },
});

export const puppetPool = createPuppeteerFactory();
