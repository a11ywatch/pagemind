import { connect, Browser, Page } from "puppeteer";
import os from "os";
import {
  firefoxHost,
  getFireFoxWsEndPoint,
  wsFirefoxEndpointurl,
  firefoxLb,
} from "../../../config/firefox";
import { clean } from "./utils/clean";

// return the valid connection for request
type ConnectionResponse = {
  browser: Browser;
  host: string;
};

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
const getConnnection = async (
  retry?: boolean,
  headers?: Record<string, string>
): Promise<ConnectionResponse> => {
  try {
    const browser = await connect({
      browserWSEndpoint: wsFirefoxEndpointurl,
      ignoreHTTPSErrors: true,
      headers,
    });

    return {
      host: firefoxHost,
      browser: browser,
    };
  } catch (e) {
    if (!retry) {
      await getFireFoxWsEndPoint(false);
      return await getConnnection(true, headers);
    } else {
      console.error(e);
      return {
        browser: null,
        host: firefoxHost,
      };
    }
  }
};

// retry and wait for ws endpoint [todo: update endpoint to perform lb request gathering external hostname]
async function getLbConnnection(
  retry?: boolean,
  headers?: Record<string, string>
): Promise<ConnectionResponse> {
  this.counter++;

  // default to main global endpoint
  let browserWSEndpoint = wsFirefoxEndpointurl;
  let host = firefoxHost;

  if (this.counter >= this.scalePoint) {
    this.counter = 1;
    const connections = await getFireFoxWsEndPoint();

    // get the next connect if valid
    if (connections[1]) {
      host = connections[0];
      browserWSEndpoint = connections[1];
    }
  }

  try {
    const browser = await connect({
      browserWSEndpoint,
      ignoreHTTPSErrors: true,
      headers,
    });

    return {
      host,
      browser,
    };
  } catch (e) {
    // reset the counter
    this.counter = 0;
    // retry connection once
    if (!retry) {
      await getFireFoxWsEndPoint(false);
      return await getConnnection(true, headers);
    } else {
      console.error(e);
      return {
        browser: null,
        host: host,
      };
    }
  }
}

// clean the connection
async function cleanLbConnection(page: Page, browser: Browser): Promise<void> {
  await clean(page, browser);
  // remove workload counter
  this.counter--;
}

// puppeteer handling
let puppetFirefoxPool = {
  acquire: getConnnection,
  clean,
  // scale prop defaults
  counter: null,
  scalePoint: null,
};

// handle load balance connection req high performance hybrid robin sequence
if (firefoxLb) {
  const mem = Math.round(
    Math.round(((os.totalmem() || 1) / 1024 / 1024) * 100) / 100000
  );

  puppetFirefoxPool = {
    acquire: getLbConnnection,
    clean: cleanLbConnection,
    // scale props
    counter: 0,
    scalePoint: Math.max(mem, 10) * 4,
  };
}

export { puppetFirefoxPool };
