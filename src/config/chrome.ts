import dns from "dns";
import { fetchUrl } from "../core/lib";

// the chrome hostname dns to connect to with lighthouse sockets
let chromeHost = process.env.CHROME_HOST;
// the chrome socket connection to connect to
let wsChromeEndpointurl = process.env.CHROME_SOCKET_URL;
// did attempt to get chrome dns
let attemptedChromeHost = false;

const lookupChromeHost = async (target: string) => {
  const url = `http://${target || "127.0.0.1"}:9222/json/version`;
  const data = await fetchUrl(url, true).catch((_) => {});

  if (data && data?.webSocketDebuggerUrl) {
    wsChromeEndpointurl = data.webSocketDebuggerUrl;
  }

  if (wsChromeEndpointurl) {
    console.log(`chrome connected on ${wsChromeEndpointurl}`);
    return Promise.resolve(wsChromeEndpointurl);
  }

  return Promise.reject("Chrome socket url not found.");
};

// bind top level chrome address
const bindChromeDns = (ad: string): Promise<string> => {
  return new Promise((resolve) => {
    dns.lookup(ad, (_err, address) => {
      // set top level address
      if (address) {
        chromeHost = address;
      }

      resolve(address || "");
    });
  });
};

// get the chrome websocket endpoint via dns lookup
const getWs = async (host?: string): Promise<string> => {
  const validateDNS = chromeHost === "chrome" || !chromeHost;

  let target = "";

  // Attempt to find chrome host through DNS [todo: dns outside]
  if (validateDNS && !attemptedChromeHost) {
    attemptedChromeHost = true;
    target = await bindChromeDns("chrome");
  }

  return new Promise((resolve, reject) => {
    lookupChromeHost(target || host)
      .then(resolve)
      .catch(reject);
  });
};

/*
 * Determine the chrome web socket connection resolved.
 * @param retry - retry connection on docker dns
 *
 * @return Promise<string> - the socket connection
 */
const getWsEndPoint = async (
  retry?: boolean,
  reconnect?: boolean
): Promise<string> => {
  if (wsChromeEndpointurl && !reconnect) {
    return Promise.resolve(wsChromeEndpointurl);
  }

  try {
    await getWs(chromeHost);
  } catch (_) {}

  // continue and attempt again next
  return new Promise(async (resolve) => {
    if (retry && !wsChromeEndpointurl) {
      setTimeout(async () => {
        try {
          await getWs();
        } catch (_) {}
      }, 50);
    }
    resolve(wsChromeEndpointurl);
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
