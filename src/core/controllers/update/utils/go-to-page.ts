/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import type { Page } from "puppeteer";

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
];

const blockedResourceTypes = [
  "media",
  "font",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  "imageset",
  "websocket",
];

const goToPage = async (
  page: Page,
  url: string,
  retryCount: number = 0
): Promise<[boolean, string]> => {
  let hasPage = true;

  if (retryCount === 0 && page) {
    await page.setRequestInterception(true).catch((e) => {
      console.error(e);
    });
    page.on("request", (request) => {
      try {
        const requestUrl = request.url()?.split("?")[0].split("#")[0];
        if (
          blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
          skippedResources.some(
            (resource) => requestUrl.indexOf(resource) !== -1
          )
        ) {
          request.abort();
        } else {
          request.continue();
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  try {
    await page?.goto(url, {
      timeout: retryCount === 0 ? 15000 : 5000,
      waitUntil: "domcontentloaded",
    });
  } catch (e) {
    console.error(e);
    hasPage = false;
  }

  return [hasPage, url];
};

export { goToPage };
