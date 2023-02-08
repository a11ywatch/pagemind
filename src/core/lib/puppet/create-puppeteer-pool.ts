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

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
async function getConnnection(
  retried?: boolean,
  headers?: Record<string, string>
): Promise<ConnectionResponse> {
  if (!this.browser) {
    try {
      this.browser = await connect({
        browserWSEndpoint: wsChromeEndpointurl,
        ignoreHTTPSErrors: true,
        headers,
      });

      return {
        host: chromeHost,
        browser: this.browser,
      };
    } catch (e) {
      // retry connection once
      if (!retried) {
        await getWsEndPoint(false);
        let browser = this.browser;
        queueMicrotask(async () => {
          await clean(null, browser)
        });
        this.browser = null;
        return await getConnnection(true, headers);
      } else {
        console.error(e);
        return {
          browser: null,
          host: chromeHost,
        };
      }
    }
  }

  return {
    host: chromeHost,
    browser: this.browser,
  };
}

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
async function getLbConnnection(
  retried?: boolean,
  headers?: Record<string, string>
): Promise<ConnectionResponse> {
  this.counter++;

  // default to main global endpoint
  let browserWSEndpoint = wsChromeEndpointurl;
  let host = chromeHost;
  const fetchConnection = this.counter >= this.scalePoint;

  if (fetchConnection) {
    this.counter = 1;
    const connections = await getWsEndPoint();
    let browser = this.browser;
    queueMicrotask(async () => {
      await clean(null, browser)
    });
    this.browser = null;

    // get the next connect if valid
    if (connections[1]) {
      host = connections[0];
      browserWSEndpoint = connections[1];
    }
  }

  // connect to cdp session
  if (fetchConnection || !this.browser) {
    try {
      this.browser = await connect({
        browserWSEndpoint,
        ignoreHTTPSErrors: true,
        headers,
      });

      return {
        host,
        browser: this.browser,
      };
    } catch (e) {
      // reset the counter
      this.counter = 0;
      // retry connection once
      if (!retried) {
        await getWsEndPoint(false);

        return await getConnnection(true, headers);
      } else {
        console.error(e);
        return {
          browser: null,
          host,
        };
      }
    }
  }

  return {
    host,
    browser: this.browser,
  };
}

// clean the connection
async function cleanLbConnection(page?: Page): Promise<void> {
  await clean(page);
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
