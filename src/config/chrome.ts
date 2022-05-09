import { get } from "http";

export const chromeHost = process.env.CHROME_HOST || "127.0.0.1";

const getWs = (host?: string): Promise<{ webSocketDebuggerUrl?: string }> => {
  return new Promise((resolve) => {
    get(`http://${host || chromeHost}:9222/json/version`, (res) => {
      res.setEncoding("utf8");
      let rawData = "";

      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(rawData));
      });
    }).on("error", (err) => {
      console.error(err.message);
      resolve({});
    });
  });
};

// the chrome socket connection to connect to
let wsChromeEndpointurl = process.env.CHROME_SOCKET_URL;

export const getWsEndPoint = async (retry?: boolean) => {
  let json;
  try {
    // retry connection on as mac localhost
    json = (await getWs(!retry ? "docker.for.mac.localhost" : "")) as any;
  } catch (e) {
    console.error(e);
  }

  if (json?.webSocketDebuggerUrl) {
    wsChromeEndpointurl = json.webSocketDebuggerUrl;
  } else if (retry) {
    setTimeout(async () => await getWsEndPoint(), 250);
  }

  return wsChromeEndpointurl;
};

if (!wsChromeEndpointurl) {
  getWsEndPoint(true);
}

export { wsChromeEndpointurl };
