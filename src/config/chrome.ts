import dns from "dns";
import { URL } from "url";
import { fetchUrl } from "../core/lib/utils/fetch";

export const chromeLb = process.env.CHROME_LB;

// the chrome hostname dns to connect to with lighthouse sockets
let chromeHost = process.env.CHROME_HOST;
let chromeLbHost = ""; // load balancer host name

// the chrome socket connection to connect to
let wsChromeEndpointurl = process.env.CHROME_SOCKET_URL;
// did attempt to get chrome dns
let attemptedChromeHost = false;

// default to http
let defaultTPTHttp = true;
let tpt = "http";

// get hostname for load balancer
if (chromeLb) {
  if (chromeLb.startsWith("https")) {
    defaultTPTHttp = false;
    tpt = "https";
  }

  try {
    const hs = new URL(chromeLb.startsWith("http") ? chromeLb : `${tpt}://${chromeLb}`);

    if (hs) {
      chromeLbHost = hs.hostname;
    }
  } catch (e) {
    console.error(e);
  }

}

// determine chrome websocket host connection
export const lookupChromeHost = async (
  target?: string,
  rp?: boolean,
  nosave?: boolean
) => {
  const data = await fetchUrl(
    `${tpt}://${target || "127.0.0.1"}:9222/json/version`,
    defaultTPTHttp
  ).catch((_) => {});

  if (data && data?.webSocketDebuggerUrl) {
    // todo: exact match trim
    const targetUrl = rp
      ? data.webSocketDebuggerUrl.replace("127.0.0.1", target)
      : data.webSocketDebuggerUrl;

    if (!nosave) {
      wsChromeEndpointurl = targetUrl;
    } else {
      return Promise.resolve(targetUrl);
    }
  }

  // resolve instance url
  return Promise.resolve(wsChromeEndpointurl);
};

// bind top level chrome address hostname
const bindChromeDns = (ad: string, nosave?: boolean): Promise<string> =>
  new Promise((resolve) => {
    dns.lookup(ad, (_err, address) => {
      // set top level address
      if (!nosave && address) {
        chromeHost = address;
      }
      resolve(address || "");
    });
  });

// get the chrome websocket endpoint via dns lookup
const getWs = async (host?: string): Promise<string> => {
  const validateDNS = chromeHost === "chrome" || !chromeHost;

  let target = "";

  // Attempt to find chrome host through DNS [todo: dns outside]
  if (validateDNS && !attemptedChromeHost) {
    attemptedChromeHost = true;
    target = await bindChromeDns("chrome");
  }

  return new Promise(async (resolve) => {
    resolve(await lookupChromeHost(target || host));
  });
};

// resolve lb instance
const getLbInstance = (nosave?: boolean): Promise<[string, string]> => {
  let address = "";
  let source = "";

  return new Promise(async (resolve) => {
    try {
      address = await bindChromeDns(chromeLbHost, nosave);
    } catch (e) {
      console.error(e);
    }

    if (address) {
      source = await lookupChromeHost(address, true, nosave);
    }

    resolve([address, source]);
  });
};

/*
 * Determine the chrome web socket connection resolved.
 * @param retry - retry connection on docker dns
 *
 * @return Promise<[string, string]> - the hostname and socket connection
 */
const getWsEndPoint = async (retry?: boolean): Promise<[string, string]> => {
  // return the load balancer instance of chrome
  if (chromeLb) {
    return new Promise((resolve) => {
      getLbInstance().then(resolve);
    });
  }

  await getWs(chromeHost);

  // continue and attempt again next
  return new Promise(async (resolve) => {
    if (retry && !wsChromeEndpointurl) {
      setTimeout(async () => {
        await getWs();
        resolve([chromeHost, wsChromeEndpointurl]);
      }, 33);
    } else {
      resolve([chromeHost, wsChromeEndpointurl]);
    }
  });
};

// set the chrome web socket directly
const setWsEndPoint = (endpoint: string) => {
  wsChromeEndpointurl = endpoint;
};

export {
  bindChromeDns,
  wsChromeEndpointurl,
  chromeHost,
  getWs,
  setWsEndPoint,
  getWsEndPoint,
};
