import dns from "dns";
import { fetchUrl } from "../core/lib/utils/fetch";
import { getLoadBalancerDefaults } from "../core/lib/utils/connection/load-balancer";

// chrome load balancer endpoint
const chromeLb = process.env.CHROME_LB;

// the chrome hostname dns to connect to with lighthouse sockets
let chromeHost = process.env.CHROME_HOST;
// the chrome socket connection to connect to
let wsChromeEndpointurl = process.env.CHROME_SOCKET_URL;

// default chrome configs
const {
  defaultTPTHttp,
  tpt,
  host: chromeLbHost,
} = getLoadBalancerDefaults(chromeLb);

// determine chrome websocket host connection
const lookupChromeHost = async (
  target?: string,
  rp?: boolean,
  nosave?: boolean
) => {
  // gets the websocket chrome target ID locally to instance
  const { webSocketDebuggerUrl } = await fetchUrl(
    `${tpt}://${target || "127.0.0.1"}:9222/json/version`,
    defaultTPTHttp
  ).catch((_) => {
    return {
      webSocketDebuggerUrl: "",
    };
  });

  // new url exist
  if (webSocketDebuggerUrl) {
    let targetUrl = webSocketDebuggerUrl;

    if (rp) {
      // replace the chrome load balancer task IP
      targetUrl = webSocketDebuggerUrl.replace("127.0.0.1", target);
    }

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
const bindChromeDns = async (ad: string, nosave?: boolean): Promise<string> => {
  try {
    const addr = await dns.promises.lookup(ad);

    if (!nosave && addr && addr.address) {
      chromeHost = addr.address;
    }

    return chromeHost;
  } catch (e) {
    console.error(e);
  }
};

// get the chrome websocket endpoint via dns lookup
const getWs = async (host?: string): Promise<string> => {
  const validateDNS = chromeHost === "chrome" || !chromeHost;
  let target = "";

  // Attempt to find chrome host through DNS [todo: dns outside]
  if (validateDNS) {
    target = await bindChromeDns("chrome");
  }

  return new Promise((resolve) => {
    lookupChromeHost(target || host).then(resolve);
  });
};

// resolve chrome lb instance
const getLbInstance = async (nosave?: boolean): Promise<[string, string]> => {
  let address = chromeHost;
  let source = "";

  const ad = await bindChromeDns(chromeLbHost, nosave);

  if (ad) {
    address = ad;
  }

  // get the source of the host json protocol
  if (address) {
    source = await lookupChromeHost(address, true, nosave);
  }

  return [address, source];
};

/*
 * Determine the chrome web socket connection resolved.
 * @param retry - retry connection on docker dns
 *
 * @return Promise<[string, string]> - the hostname and socket connection
 */
const getWsEndPoint = async (
  retry?: boolean,
  bindHost?: boolean
): Promise<[string, string]> => {
  // return the load balancer instance of chrome
  if (chromeLb) {
    return new Promise(async (resolve) => {
      const clb = await getLbInstance();

      if (bindHost) {
        // bind the request context
        if (clb[1]) {
          chromeHost = clb[0];
          wsChromeEndpointurl = clb[1];
        }
      }

      resolve(clb);
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
  chromeLb,
  wsChromeEndpointurl,
  chromeHost,
  setWsEndPoint,
  getWsEndPoint,
};
