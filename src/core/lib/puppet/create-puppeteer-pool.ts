import { connect, Browser } from "puppeteer";
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

let browser: Browser;

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
const getConnnection = async (
  retry?: boolean,
  headers?: Record<string, string>
): Promise<ConnectionResponse> => {
  if (browser && !retry) {
    return {
      host: chromeHost,
      browser,
    };
  }

  try {
    browser = await connect({
      browserWSEndpoint: wsChromeEndpointurl,
      ignoreHTTPSErrors: true,
      headers,
    });

    return {
      host: chromeHost,
      browser,
    };
  } catch (e) {
    // retry connection once
    if (!retry) {
      await getWsEndPoint(false);
      await puppetPool.clean(null, browser);
      return await puppetPool.acquire(true, headers);
    } else {
      console.error(`Retry connection error ${e?.message}`);
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
