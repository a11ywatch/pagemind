import { get } from "http";

let chromeHost = process.env.CHROME_HOST || "127.0.0.1";

const getWs = (host?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    get(`http://${host || chromeHost}:9222/json/version`, (res) => {
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
  });
};

// the chrome socket connection to connect to
let wsChromeEndpointurl = process.env.CHROME_SOCKET_URL;

export const getWsEndPoint = async (retry?: boolean) => {
  try {
    let retryHost = !retry ? "docker.for.mac.localhost" : "";
    // retry connection on as mac localhost
    wsChromeEndpointurl = await getWs(retryHost);
    // if docker host valid set the default host for lighthouse
    if (!retry && wsChromeEndpointurl) {
      chromeHost = "docker.for.mac.localhost";
    }
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
