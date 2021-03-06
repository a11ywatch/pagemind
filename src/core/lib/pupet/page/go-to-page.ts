import { pa11yConfig } from "@app/config/pa11y-config";
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

const goToPage = async (page: Page, url: string): Promise<boolean> => {
  try {
    await page?.setRequestInterception(true);
    page?.on("request", networkBlock);
  } catch (e) {
    console.error(e);
  }

  return new Promise(async (resolve) => {
    try {
      await page?.goto(url, {
        timeout: pa11yConfig.timeout,
        waitUntil: "domcontentloaded",
      });
      resolve(true);
    } catch (e) {
      console.error(e);
      resolve(false);
    }
  });
};

export { goToPage };
