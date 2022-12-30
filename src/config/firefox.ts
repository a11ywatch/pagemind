import dns from "dns";
import { fetchUrl } from "../core/lib/utils/fetch";
import { getLoadBalancerDefaults } from "../core/lib/utils/connection/load-balancer";

export const firefoxLb = process.env.FIREFOX_LB;

// the firefox hostname dns to connect to with lighthouse sockets
let firefoxHost = process.env.FIREFOX_HOST;
// the firefox socket connection to connect to
let wsFirefoxEndpointurl = process.env.FIREFOX_SOCKET_URL;
// did attempt to get firefox dns
let attemptedFirefoxHost = false;

// default firefox configs
const {
  defaultTPTHttp: firefoxDefaultTPTHttp,
  tpt: fireFoxTPT,
  host: firefoxLbHost,
} = getLoadBalancerDefaults(firefoxLb);

// determine firefox websocket host connection
const lookupFirefoxHost = async (
  target?: string,
  rp?: boolean,
  nosave?: boolean
) => {
  const { webSocketDebuggerUrl } = await fetchUrl(
    `${fireFoxTPT}://${target || "127.0.0.1"}:6001`,
    firefoxDefaultTPTHttp
  ).catch((_) => {
    return {
      webSocketDebuggerUrl: "",
    };
  });

  if (webSocketDebuggerUrl) {
    const targetUrl = rp
      ? webSocketDebuggerUrl.replace("127.0.0.1", target)
      : webSocketDebuggerUrl;

    if (!nosave) {
      wsFirefoxEndpointurl = targetUrl;
    } else {
      return Promise.resolve(targetUrl);
    }
  }

  // resolve instance url
  return Promise.resolve(wsFirefoxEndpointurl);
};

// bind top level firefox address hostname
const bindFirefoxDns = (ad: string, nosave?: boolean): Promise<string> =>
  new Promise((resolve) => {
    dns.lookup(ad, (_err, address) => {
      // set top level address
      if (!nosave && address) {
        firefoxHost = address;
      }
      resolve(address || "");
    });
  });

const getFirefoxWs = async (host?: string): Promise<string> => {
  const validateDNS = firefoxHost === "firefox" || !firefoxHost;
  let target = "";

  // Attempt to find firefox host through DNS [todo: dns outside]
  if (validateDNS && !attemptedFirefoxHost) {
    attemptedFirefoxHost = true;
    target = await bindFirefoxDns("firefox");
  }

  return new Promise((resolve) => {
    lookupFirefoxHost(target || host).then(resolve);
  });
};

const getFirefoxLbInstance = (nosave?: boolean): Promise<[string, string]> => {
  let address = "";
  let source = "";

  return new Promise(async (resolve) => {
    try {
      address = await bindFirefoxDns(firefoxLbHost, nosave);
    } catch (e) {
      console.error(e);
    }

    if (address) {
      source = await lookupFirefoxHost(address, true, nosave);
    }

    resolve([address, source]);
  });
};

/*
 * Determine the firefox web socket connection resolved.
 * @param retry - retry connection on docker dns
 *
 * @return Promise<[string, string]> - the hostname and socket connection
 */
const getFireFoxWsEndPoint = async (
  retry?: boolean
): Promise<[string, string]> => {
  // return the load balancer instance of firefox
  if (firefoxLb) {
    return new Promise((resolve) => {
      getFirefoxLbInstance().then(resolve);
    });
  }

  await getFirefoxWs(firefoxHost);

  // continue and attempt again next
  return new Promise(async (resolve) => {
    if (retry && !wsFirefoxEndpointurl) {
      setTimeout(async () => {
        await getFirefoxWs();
        resolve([firefoxHost, wsFirefoxEndpointurl]);
      }, 33);
    } else {
      resolve([firefoxHost, wsFirefoxEndpointurl]);
    }
  });
};

// set the chrome web socket directly
const setFirefoxWsEndPoint = (endpoint: string) => {
  wsFirefoxEndpointurl = endpoint;
};

export {
  firefoxHost,
  bindFirefoxDns,
  wsFirefoxEndpointurl,
  getFireFoxWsEndPoint,
  getFirefoxWs,
  setFirefoxWsEndPoint,
};
