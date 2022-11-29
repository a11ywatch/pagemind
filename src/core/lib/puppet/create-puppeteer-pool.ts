import puppeteer from "puppeteer";
import os from "os";
import type { Browser, Page } from "puppeteer";
import {
  chromeHost,
  getWsEndPoint,
  wsChromeEndpointurl,
  chromeLb,
} from "../../../config/chrome";

// return the valid connection for request
type ConnectionResponse = {
  browser: Browser;
  host: string;
};

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
const getConnnection = async (retry?: boolean): Promise<ConnectionResponse> => {
  try {
    return {
      host: chromeHost,
      browser: await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
        ignoreHTTPSErrors: true,
      }),
    };
  } catch (e) {
    // retry connection once
    if (!retry) {
      await getWsEndPoint(false);
      return await getConnnection(true);
    } else {
      console.error(e);
      return {
        browser: null,
        host: chromeHost,
      };
    }
  }
};

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
async function getLbConnnection(retry?: boolean): Promise<ConnectionResponse> {
  this.counter++;

  // default to main global endpoint
  let browserWSEndpoint = wsChromeEndpointurl;
  let host = chromeHost;

  if (this.counter >= this.scalePoint) {
    this.counter = 1;
    const connections = await getWsEndPoint();

    // get the next connect if valid
    if (connections[1]) {
      host = connections[0];
      browserWSEndpoint = connections[1];
    }
  }

  try {
    return {
      host,
      browser: await puppeteer.connect({
        browserWSEndpoint,
        ignoreHTTPSErrors: true,
      }),
    };
  } catch (e) {
    // reset the counter
    this.counter = 0;
    // retry connection once
    if (!retry) {
      await getWsEndPoint(false);
      return await getConnnection(true);
    } else {
      console.error(e);
      return {
        browser: null,
        host: chromeHost,
      };
    }
  }
}

// clean the connection
const clean = async (page: Page, browser: Browser) => {
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
};

// clean the connection
async function cleanLbConnection(page: Page, browser: Browser): Promise<void> {
  await clean(page, browser);
  // remove workload counter
  this.counter--;
}

// puppeteer handling
let puppetPool = {
  acquire: getConnnection,
  clean,
  // scale prop defaults
  counter: null,
  scalePoint: null,
};

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
}

export { puppetPool };
