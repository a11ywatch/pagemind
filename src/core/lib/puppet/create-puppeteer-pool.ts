import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { getWsEndPoint, wsChromeEndpointurl } from "../../../config/chrome";

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
const getConnnection = async (retry?: boolean): Promise<Browser> => {
  try {
    return await puppeteer.connect({
      browserWSEndpoint: wsChromeEndpointurl,
      ignoreHTTPSErrors: true,
    });
  } catch (e) {
    // retry connection once
    if (!retry) {
      await getWsEndPoint(false);
      return await getConnnection(true);
    } else {
      console.error(e);
    }
  }
};

// puppeteer handling
export const puppetPool = {
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
};
