import { a11yConfig } from "../../../../config/a11y-config";
import { blockedResourceTypes, skippedResources } from "./resource-ignore";
import type { Page, HTTPRequest } from "puppeteer";

export const networkBlock = (request: HTTPRequest, allowImage?: boolean) => {
  const resourceType = request.resourceType();

  // allow images upon reload intercepting.
  if (resourceType === "image" && allowImage) {
    return request.continue();
  }

  if (blockedResourceTypes.hasOwnProperty(resourceType)) {
    return request.abort();
  }

  const url = request.url();

  if (url && resourceType === "script") {
    const urlBase = url.split("?");
    const splitBase = urlBase.length ? urlBase[0].split("#") : [];
    const requestUrl = splitBase.length ? splitBase[0] : "";

    if (skippedResources.hasOwnProperty(requestUrl)) {
      return request.abort();
    }
  }

  return request.continue();
};

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
