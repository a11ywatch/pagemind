import { connect, Browser, Page } from "puppeteer";
import os from "os";
import {
  chromeHost,
  getWsEndPoint,
  wsChromeEndpointurl,
  chromeLb,
} from "../../../config/chrome";
import { clean } from "./utils/clean";

// return the valid connection for request
type ConnectionResponse = {
  browser: Browser;
  host: string;
};

// puppeteer handling
let puppetPool = {
  acquire: (_retry?: boolean, _headers?: Record<string, string>) => {
    return Promise.resolve({
      host: chromeHost,
      browser: null,
    });
  },
  clean: (_, __) => Promise.resolve(),
  // scale prop defaults
  counter: null,
  scalePoint: null,
};

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
const getConnnection = async (
  retry?: boolean,
  headers?: Record<string, string>
): Promise<ConnectionResponse> => {
  try {
    const browser = await connect({
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
      return await puppetPool.acquire(true, headers);
    } else {
      console.error(`Retry connection error ${e}`);
      return {
        browser: null,
        host: chromeHost,
      };
    }
  }
};

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
async function getLbConnnection(
  retry?: boolean,
  headers?: Record<string, string>
): Promise<ConnectionResponse> {
  if (this.counter >= this.scalePoint) {
    this.counter = 0; // reset counter
    await getWsEndPoint(false, true);
  }

  this.counter++;

  try {
    const browser = await connect({
      browserWSEndpoint: wsChromeEndpointurl,
      ignoreHTTPSErrors: true,
      headers,
    });

    return {
      host: chromeHost,
      browser,
    };
  } catch (e) {
    // reset the counter
    this.counter = 0;
    // retry connection once
    if (!retry) {
      await getWsEndPoint(false, true);

      return await puppetPool.acquire(true, headers);
    } else {
      console.error(`Retry LB connection error: ${e?.message}`);

      return {
        browser: null,
        host: chromeHost,
      };
    }
  }
}

// clean the connection
async function cleanLbConnection(page: Page, browser: Browser): Promise<void> {
  await clean(page, browser);
  this.counter--;
}

// handle load balance connection req high performance hybrid robin sequence
if (chromeLb) {
  const mem = Math.round(
    Math.round(((os.totalmem() || 1) / 1024 / 1024) * 100) / 100000
  );

  puppetPool = {
    acquire: getLbConnnection,
    clean: cleanLbConnection,
    // scale props
    counter: 0,
    scalePoint: Math.max(mem, 10) * 4,
  };
} else {
  // puppeteer handling
  puppetPool = {
    acquire: getConnnection,
    clean,
    // scale prop defaults
    counter: null,
    scalePoint: null,
  };
}

export { puppetPool };
