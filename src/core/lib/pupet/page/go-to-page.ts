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
  // "imageset",
  // "image", // images can take intense CPU
];

const networkBlock = (request: HTTPRequest) => {
  const requestUrl = request.url()?.split("?")[0].split("#")[0];
  if (
    blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
    skippedResources.some((resource) => requestUrl.indexOf(resource) !== -1)
  ) {
    request.abort();
  } else {
    request.continue();
  }
};

const goToPage = async (page: Page, url: string): Promise<boolean> => {
  let hasPage = true;

  try {
    await page.setRequestInterception(true);
    page.on("request", networkBlock);
  } catch (e) {
    console.error(e);
  }

  try {
    await page.goto(url, {
      timeout: pa11yConfig.timeout,
      waitUntil: "domcontentloaded",
    });
  } catch (e) {
    console.error(e);
    hasPage = false;
  }

  return hasPage;
};

export { goToPage };
