import { get } from "http";

export const chromeHost = process.env.CHROME_HOST || "127.0.0.1";

const getWs = (): Promise<{ webSocketDebuggerUrl?: string }> => {
  return new Promise((resolve) => {
    get(`http://${chromeHost}:9222/json/version`, (res) => {
      let data = [];
      res.on("data", (chunk) => {
        data.push(chunk);
      });
      res.on("end", () => {
        resolve(JSON.parse(data.join()));
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
  try {
    const json = (await getWs()) as any;

    if (json?.webSocketDebuggerUrl) {
      wsChromeEndpointurl = json.webSocketDebuggerUrl;
    } else if (retry) {
      setTimeout(() => getWsEndPoint(), 250);
    }
  } catch (e) {
    console.error(e);
  }

  return wsChromeEndpointurl;
};

if (!wsChromeEndpointurl) {
  getWsEndPoint(true);
}

export { wsChromeEndpointurl };
