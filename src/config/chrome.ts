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
  const data = await fetchUrl(url, true).catch((_) => {});

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

    try {
      // add dns lookup from network
      if (!chromeHost && !attemptedChromeHost) {
        attemptedChromeHost = true;
        dns.lookup("chrome", (_err, address) => {
          if (address) {
            chromeHost = address;
            // attempt to find in chrome host
            lookupChromeHost(chromeHost)
              .then((v) => {
                resolve(v);
              })
              .catch((e) => reject(e));
          } else {
            lookupChromeHost(defaultHost)
              .then((v) => {
                resolve(v);
              })
              .catch((e) => reject(e));
          }
        });
      } else {
        lookupChromeHost(defaultHost)
          .then((v) => {
            resolve(v);
          })
          .catch((_) => {});
      }
    } catch (e) {
      reject(e);
    }
  });
};

// get the chrome web socket
const getWsEndPoint = async (retry?: boolean) => {
  try {
    let retryHost = !retry ? "host.docker.internal" : "";
    // retry connection on as mac localhost
    await getWs(retryHost);
    return wsChromeEndpointurl;
  } catch (_) {}

  // continue and attempt again in a timeout
  return new Promise((resolve) => {
    if (retry) {
      setTimeout(async () => {
        await getWs().catch((e) => {
          console.error(e);
        });
        resolve(wsChromeEndpointurl || "");
      }, 10);
    } else {
      resolve(wsChromeEndpointurl);
    }
  });
};

// set the chrome web socket
const setWsEndPoint = (endpoint: string) => {
  wsChromeEndpointurl = endpoint;
};

export { wsChromeEndpointurl, chromeHost, getWs, setWsEndPoint, getWsEndPoint };
