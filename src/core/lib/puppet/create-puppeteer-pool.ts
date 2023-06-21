import { chromium, Browser } from "playwright";
import {
  chromeHost,
  getWsEndPoint,
  wsChromeEndpointurl,
} from "../../../config/chrome";
import { clean } from "./utils/clean";

// return the valid connection for request
type ConnectionResponse = {
  browser: Browser;
  host: string;
};

let browser: Browser = null;

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
const getConnnection = async (
  retry?: boolean,
  headers?: Record<string, string>,
  retryCount?: number
): Promise<ConnectionResponse> => {
  // direct return browser
  if (browser && !retry) {
    return {
      host: chromeHost,
      browser,
    };
  }

  try {
    // only one browser allowed per cluster
    browser = await chromium.connectOverCDP(wsChromeEndpointurl, {
      headers,
    });

    return {
      host: chromeHost,
      browser,
    };
  } catch (e) {
    // retry connection once
    if (!retry) {
      browser = null;
      await getWsEndPoint(false);
      return await getConnnection(true, headers, retryCount);
    } else {
      console.error(`Retry connection error ${e}`);

      if (!retryCount || (retryCount && retryCount < 10)) {
        browser = null;
        // keep retrying until connected
        const retrySet = (retryCount ?? 0) + 1;

        // attempt to repair once
        setTimeout(async () => await getWsEndPoint(true), 2000 * retrySet);
      }

      return {
        browser: null,
        host: chromeHost,
      };
    }
  }
};

const puppetPool = {
  acquire: getConnnection,
  clean,
};

export { puppetPool };
