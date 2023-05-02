import { a11yConfig } from "../../../../config/a11y-config";
import { blockedResourceTypes, skippedResources } from "./resource-ignore";
import type { Page, HTTPRequest, WaitForOptions } from "puppeteer";

const networkBlock = async (request: HTTPRequest, allowImage?: boolean) => {
  if (
    request.isInterceptResolutionHandled &&
    request.isInterceptResolutionHandled()
  ) {
    return await Promise.resolve();
  }

  const resourceType = request.resourceType();

  // allow images upon reload intercepting.
  if (resourceType === "image" && allowImage) {
    return await request.continue();
  }

  if (blockedResourceTypes.hasOwnProperty(resourceType)) {
    return await request.abort();
  }

  const url = request.url();

  if (url && resourceType === "script") {
    const urlBase = url.split("?");
    const splitBase = urlBase.length ? urlBase[0].split("#") : [];
    const requestUrl = splitBase.length ? splitBase[0] : "";

    if (skippedResources.hasOwnProperty(requestUrl)) {
      return await request.abort();
    }
  }

  return await request.continue();
};

const setNetwork = async (page: Page): Promise<void> => {
  try {
    await page.setRequestInterception(true);
    page.on("request", networkBlock);
  } catch (e) {
    //
  }
};

const navConfig: WaitForOptions = {
  timeout: a11yConfig.timeout,
  waitUntil: "domcontentloaded",
};

// lazy go to page
const goToPage = async (page: Page, url: string): Promise<boolean> => {
  let valid = false;

  await setNetwork(page);

  return new Promise(async (resolve) => {
    try {
      const res = await page.goto(url, navConfig);
      if (res) {
        valid = res.status() === 304 || res.ok();
      }
    } catch (e) {
      // page does not exist
    }

    resolve(valid);
  });
};

// set RAW HTML CONTENT
const setHtmlContent = async (
  page: Page,
  html: string,
  url: string
): Promise<boolean> => {
  let valid = false;
  let firstRequest = false;

  try {
    await page.setRequestInterception(true);
  } catch (e) {
    console.error(e);
  }

  return new Promise(async (resolve) => {
    try {
      page.on("request", async (request) => {
        // initial page navigation request intercept with custom HTML
        if (!firstRequest) {
          firstRequest = true;
          await request.respond({
            status: 200,
            contentType: "text/html",
            body: html,
          });
        } else {
          await networkBlock(request);
        }
      });

      const res = await page.goto(url, navConfig);

      if (res) {
        valid = res.status() === 304 || res.ok();
      }
    } catch (e) {
      //
    }

    resolve(valid);
  });
};

export { goToPage, setHtmlContent, networkBlock };
