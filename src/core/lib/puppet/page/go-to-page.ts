import { a11yConfig } from "../../../../config/a11y-config";
import type { Page, HTTPRequest } from "puppeteer";

const skippedResources = [
  "quantserve",
  "adzerk",
  "doubleclick",
  "adition",
  "exelator",
  "sharethrough",
  "cdn.api.twitter",
  "google-analytics",
  "googletagmanager",
  "usefathom",
  "google",
  "fontawesome",
  "facebook",
  "analytics",
  "optimizely",
  "clicktale",
  "mixpanel",
  "zedo",
  "clicksor",
  "tiqcdn",
  "livereload",
  "cdn.jsdelivr.net",
  "https://www.facebook.com/sharer.php?", // authenticated facebook page
  "googlesyndication.com",
  "adservice.google.com",
  "client.crisp.chat",
  "widget.intercom.io",
];

const blockedResourceTypes = [
  "media",
  "font",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  "websocket",
  "script",
  "preflight",
  "image",
  "imageset",
  "ping",
];

export const networkBlock = (request: HTTPRequest, allowImage?: boolean) => {
  const url = request.url();
  const urlBase = url?.split("?");
  const splitBase = urlBase?.length ? urlBase[0].split("#") : [];
  const requestUrl = splitBase?.length ? splitBase[0] : "";

  const resourceType = request.resourceType();

  // allow images upon reload intercepting.
  if (resourceType === "image" && allowImage) {
    request.continue();
    return;
  }

  // abort all video request
  if (
    resourceType == "media" ||
    url.endsWith(".mp4") ||
    url.endsWith(".avi") ||
    url.endsWith(".flv") ||
    url.endsWith(".mov") ||
    url.endsWith(".wmv")
  ) {
    request.abort();
    return;
  }

  if (
    blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
    skippedResources.some((resource) => requestUrl.indexOf(resource) !== -1)
  ) {
    request.abort();
    return;
  }

  request.continue();
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
