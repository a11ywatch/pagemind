import { startGRPC } from "./proto/init";
import { getWsEndPoint, setWsEndPoint } from "./config/chrome";
import { chromeArgs } from "./config/chrome-args";
import { generateRandomAgents } from "./core/lib/puppet/agent";

export const coreServer = async () => {
  const [_, endpoints] = await Promise.all([startGRPC(), getWsEndPoint(true)]);
  const [__, endpoint] = endpoints;

  // launch chrome instance local
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

  // generate app agents
  generateRandomAgents();
};

(async () => {
  await coreServer();
})();

// cron daily reset agents
