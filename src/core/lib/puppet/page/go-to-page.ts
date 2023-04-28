import { networkBlock as blocknet } from "a11y-js/build/utils/go-to-page";
import { a11yConfig } from "../../../../config/a11y-config";
import type { Page, HTTPRequest } from "puppeteer";

export const networkBlock = async (
  request: HTTPRequest,
  allowImage?: boolean
) => await blocknet(request, undefined, allowImage);

const setNetwork = async (page: Page): Promise<boolean> => {
  try {
    await page.setRequestInterception(true);
    page.on("request", networkBlock);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// lazy go to page
const goToPage = async (page: Page, url: string): Promise<boolean> => {
  let valid = false;

  await setNetwork(page);
  return new Promise(async (resolve) => {
    try {
      const res = await page.goto(url, {
        timeout: a11yConfig.timeout,
        waitUntil: "domcontentloaded",
      });
      if (res) {
        valid = res.status() === 304 || res.ok();
      }
    } catch (e) {
      console.error(e);
    }

    resolve(valid);
  });
};

// raw html content
const setHtmlContent = async (page: Page, html: string): Promise<boolean> => {
  let valid = false;

  await setNetwork(page);
  return new Promise(async (resolve) => {
    try {
      await page.setContent(html, {
        timeout: a11yConfig.timeout,
        waitUntil: "domcontentloaded",
      });
      valid = true;
    } catch (e) {
      console.error(e);
    }

    resolve(valid);
  });
};

export { goToPage, setHtmlContent };
