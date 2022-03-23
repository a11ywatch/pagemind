import fetch from "node-fetch";

export const chromeHost = process.env.CHROME_HOST || "docker.for.mac.localhost";

let wsChromeEndpointurl;

const getWsEndPoint = async () => {
  try {
    const req = await fetch(`http://${chromeHost}:9222/json/version`);
    if (req.ok) {
      const json = await req.json();
      wsChromeEndpointurl = json.webSocketDebuggerUrl;
    }
  } catch (e) {
    console.error(e);
  }
};

getWsEndPoint();

export { wsChromeEndpointurl };