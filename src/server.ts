import { startGRPC } from "./proto/init";
import { getWsEndPoint, setWsEndPoint } from "./config/chrome";
import { chromeArgs } from "./config/chrome-args";

export const coreServer = async () => {
  const [_, endpoint] = await Promise.all([startGRPC(), getWsEndPoint(true)]);

  // launch locally
  if (!endpoint) {
    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.launch({
        devtools: true,
        headless: true,
        args: chromeArgs,
        waitForInitialPage: false,
      });
      const browserWSEndpoint = await browser.wsEndpoint();

      if (browserWSEndpoint) {
        setWsEndPoint(browserWSEndpoint);
        console.log(`chrome launched and connected on: ${browserWSEndpoint}`);
      }
    } catch (e) {
      console.error("could not start chrome", e);
    }
  }
};

(async () => {
  await coreServer();
})();
