import { startGRPC } from "./proto/init";
import { getWsEndPoint, setWsEndPoint } from "./config/chrome";

export const coreServer = async () => {
  await startGRPC();
  // attempt to get chrome ws endpoint
  let endpoint = await getWsEndPoint(true);

  // retry again with minor delay
  if (!endpoint) {
    setTimeout(async () => {
      endpoint = await getWsEndPoint(true);

      // Launch  pupeteer locally
      if (!endpoint) {
        try {
          const puppeteer = await import("puppeteer");
          const browser = await puppeteer.launch({
            devtools: true,
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            waitForInitialPage: false,
          });
          const browserWSEndpoint = await browser.wsEndpoint();

          if (browserWSEndpoint) {
            setWsEndPoint(browserWSEndpoint);
            console.log(
              `chrome launched and connected on: ${browserWSEndpoint}`
            );
          }
        } catch (e) {
          console.error("could not start chrome", e);
        }
      }
    }, 11);
  }
};

(async () => {
  await coreServer();
})();
