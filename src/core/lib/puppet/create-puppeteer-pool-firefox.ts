import { connect, Browser } from "puppeteer";
import {
  firefoxHost,
  getFireFoxWsEndPoint,
  wsFirefoxEndpointurl,
} from "../../../config/firefox";
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
  try {
    if (!browser || retry) {
      browser = await connect({
        browserWSEndpoint: wsFirefoxEndpointurl,
        ignoreHTTPSErrors: true,
        headers,
      });
    }

    return {
      host: firefoxHost,
      browser: browser,
    };
  } catch (e) {
    if (!retry) {
      await getFireFoxWsEndPoint(false);
      await puppetFirefoxPool.clean(null, browser);

      return await puppetFirefoxPool.acquire(true, headers);
    } else {
      console.error(`Retry connection error ${e?.message}`);
      return {
        browser: null,
        host: firefoxHost,
      };
    }
  }
};

// handle load balance connection req high performance hybrid robin sequence
const puppetFirefoxPool = {
  acquire: getConnnection,
  clean,
};

export { puppetFirefoxPool };
