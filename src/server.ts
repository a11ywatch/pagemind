import { startGRPC } from "./proto/init";
import { getWsEndPoint, setWsEndPoint } from "./config/chrome";
import { getFireFoxWsEndPoint, setFirefoxWsEndPoint } from "./config/firefox";

import { chromeArgs } from "./config/chrome-args";
import { firefoxArgs } from "./config/firefox-args";
import { puppetPool } from "./core/lib";

const firefoxEnabled = process.env.FIREFOX_ENABLED === "true";

export const coreServer = async () => {
  const [_, endpoints, firefoxEndpoints] = await Promise.all([
    startGRPC(),
    getWsEndPoint(true),
    firefoxEnabled ? getFireFoxWsEndPoint(true) : Promise.resolve([null, null]),
  ]);

  const [__, endpoint] = endpoints;
  const [___, firefoxEndpoint] = firefoxEndpoints;

  // launch chrome instance local
  if (!endpoint) {
    try {
      const playwright = await import("playwright");
      const browserServer = await playwright.chromium.launchServer({
        headless: true,
        args: chromeArgs,
      });
      const browserWSEndpoint = browserServer.wsEndpoint();

      if (browserWSEndpoint) {
        setWsEndPoint(browserWSEndpoint);
        console.log(`chrome launched and connected on: ${browserWSEndpoint}`);
      }
    } catch (e) {
      console.error(
        "could not start chrome. Check to see if chrome is downloaded on the system.",
        e
      );
    }
  }

  // launch firefox locally
  if (firefoxEnabled && !firefoxEndpoint) {
    try {
      const playwright = await import("playwright");
      const browserServer = await playwright.firefox.launchServer({
        headless: true,
        args: firefoxArgs,
      });
      const browserWSEndpoint = browserServer.wsEndpoint();

      if (browserWSEndpoint) {
        setFirefoxWsEndPoint(browserWSEndpoint);
        console.log(`firefox launched and connected on: ${browserWSEndpoint}`);
      }
    } catch (e) {
      console.error(
        "could not start firefox. Check to see if firefox is downloaded on the system.",
        e
      );
    }
  }

  await puppetPool.acquire(false);
};

(async () => {
  await coreServer();
})();

// cron daily reset agents
