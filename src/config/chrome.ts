import dns from "dns";
import { fetchUrl } from "../core/lib/utils/fetch";
import { getLoadBalancerDefaults } from "../core/lib/utils/connection/load-balancer";

export const chromeLb = process.env.CHROME_LB;

// the chrome hostname dns to connect to with lighthouse sockets
let chromeHost = process.env.CHROME_HOST;
// the chrome socket connection to connect to
let wsChromeEndpointurl = process.env.CHROME_SOCKET_URL;
// did attempt to get chrome dns
let attemptedChromeHost = false;

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
  const { webSocketDebuggerUrl } = await fetchUrl(
    `${tpt}://${target || "127.0.0.1"}:9222/json/version`,
    defaultTPTHttp
  ).catch((_) => {
    return {
      webSocketDebuggerUrl: "",
    };
  });

  if (webSocketDebuggerUrl) {
    // todo: exact match trim performance
    const targetUrl = rp
      ? webSocketDebuggerUrl.replace("127.0.0.1", target)
      : webSocketDebuggerUrl;

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

  return new Promise((resolve) => {
    lookupChromeHost(target || host).then(resolve);
  });
};

// resolve chrome lb instance
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
 * @param rebind - rebind the singletons on lb
 * @return Promise<[string, string]> - the hostname and socket connection
 */
const getWsEndPoint = async (
  retry?: boolean,
  rebind?: boolean
): Promise<[string, string]> => {
  // return the load balancer instance of chrome
  if (chromeLb) {
    return new Promise(async (resolve) => {
      const clb = await getLbInstance();

      if (rebind) {
        // get the next connect if valid
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

export { wsChromeEndpointurl, chromeHost, setWsEndPoint, getWsEndPoint };
