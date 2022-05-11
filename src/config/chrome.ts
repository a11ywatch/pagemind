import { get } from "http";
import dns from "dns";

// the chrome hostname dns to connect to with lighthouse sockets
let chromeHost = process.env.CHROME_HOST;
// the chrome socket connection to connect to
let wsChromeEndpointurl = process.env.CHROME_SOCKET_URL;

const getWs = (host?: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const defaultHost = host || chromeHost || "127.0.0.1";

    const lookupChromeHost = (target?: string) => {
      get(`http://${target || defaultHost}:9222/json/version`, (res) => {
        res.setEncoding("utf8");
        let rawData = "";

        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          let data;
          try {
            data = JSON.parse(rawData);
          } catch (e) {
            console.error(e);
          }
          resolve(data?.webSocketDebuggerUrl);
        });
      }).on("error", (err) => {
        reject(
          `${err.message}: Retrying with docker host targets. Set the env variable of 'CHROME_HOST' before to bypass retries.`
        );
      });
    };

    // add dns lookup from network
    if (!chromeHost) {
      dns.lookup("chrome", (_err, address, family) => {
        console.log("address: %j family: IPv%s", address, family);
        chromeHost = address;
        lookupChromeHost(address);
      });
    } else {
      lookupChromeHost();
    }
  });
};

export const getWsEndPoint = async (retry?: boolean) => {
  try {
    let retryHost = !retry ? "host.docker.internal" : "";
    // retry connection on as mac localhost
    wsChromeEndpointurl = await getWs(retryHost);
  } catch (e) {
    console.error(e);
  }

  try {
    if (!wsChromeEndpointurl && retry) {
      await getWsEndPoint();
    }
  } catch (e) {
    console.error(e);
  }

  return wsChromeEndpointurl;
};

export { wsChromeEndpointurl, chromeHost };
