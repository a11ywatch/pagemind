import dns from "dns";
import { fetchUrl } from "../core/lib";

// the chrome hostname dns to connect to with lighthouse sockets
let chromeHost = process.env.CHROME_HOST;
// the chrome socket connection to connect to
let wsChromeEndpointurl = process.env.CHROME_SOCKET_URL;
// did attempt to get chrome dns
let attemptedChromeHost = false;

const lookupChromeHost = async (target?: string) => {
  const url = `http://${target}:9222/json/version`;

  const data = !wsChromeEndpointurl
    ? await fetchUrl(url, true).catch((_) => {})
    : wsChromeEndpointurl;

  if (data && data?.webSocketDebuggerUrl) {
    wsChromeEndpointurl = data.webSocketDebuggerUrl;
    console.log(`chrome connected on ${data.webSocketDebuggerUrl}`);
  }

  return wsChromeEndpointurl;
};

// get the chrome websocket endpoint via dns lookup
const getWs = (host?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const defaultHost = host || "127.0.0.1";

    // Attempt to find chrome host through DNS docker
    if (!chromeHost && !attemptedChromeHost) {
      attemptedChromeHost = true;
      // TODO: remove DNS lookup
      dns.lookup("chrome", (_err, address) => {
        if (address) {
          chromeHost = address;
        }
        // attempt to find in chrome host
        lookupChromeHost(address ? chromeHost : defaultHost)
          .then(resolve)
          .catch(reject);
      });
    } else {
      lookupChromeHost(defaultHost).then(resolve).catch(reject);
    }
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
    return wsChromeEndpointurl;
  }

  try {
    let retryHost = !retry ? "host.docker.internal" : "";
    await getWs(retryHost); // re-establish chrome socket
    return wsChromeEndpointurl; // returns singleton if succeeds
  } catch (_) {}

  // continue and attempt again in a small delayed timeout
  return new Promise((resolve) => {
    if (retry) {
      setTimeout(async () => {
        await getWs().catch((e) => {
          console.error(e);
        });
        resolve(wsChromeEndpointurl);
      }, 4);
    } else {
      resolve(wsChromeEndpointurl);
    }
  });
};

// set the chrome web socket directly
const setWsEndPoint = (endpoint: string) => {
  wsChromeEndpointurl = endpoint;
};

export { wsChromeEndpointurl, chromeHost, getWs, setWsEndPoint, getWsEndPoint };
