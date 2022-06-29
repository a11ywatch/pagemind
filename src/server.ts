import { startGRPC } from "./proto/init";
import { getWsEndPoint, setWsEndPoint } from "./config/chrome";

export const coreServer = async () => {
  await startGRPC();
  const endpoint = await getWsEndPoint(true).catch((e) => {
    console.error(e);
  });

  try {
    // launch chrome and get endpoint
    if (!endpoint) {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.launch({
        devtools: true,
        headless: true,
      });
      const browserWSEndpoint = await browser.wsEndpoint();

      if (browserWSEndpoint) {
        setWsEndPoint(browserWSEndpoint);
        console.log(`chrome launched and connected on: ${browserWSEndpoint}`);
      }
    }
  } catch (e) {
    console.error("could not start chrome", e);
  }
};

coreServer();
