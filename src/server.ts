import { startGRPC } from "./proto/init";
import { getWsEndPoint, setWsEndPoint } from "./config/chrome";

export const coreServer = async () => {
  await startGRPC();
  let endpoint = await getWsEndPoint(true).catch((e) => {
    console.error(e);
  });

  // retry again with minor delay
  if (!endpoint) {
    setTimeout(async () => {
      let endpoint = await getWsEndPoint(true).catch((e) => {
        console.error(e);
      });

      // launch chrome and get endpoint
      if (!endpoint) {
        try {
          const puppeteer = await import("puppeteer");
          const browser = await puppeteer.launch({
            devtools: true,
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
    }, 25);
  }
};

coreServer();
