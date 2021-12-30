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
  url: string
): Promise<[boolean, string]> => {
  let hasPage = true;

  try {
    await page.setRequestInterception(true);
  } catch (e) {
    console.error(e);
  }

  page.on("request", (request) => {
    const requestUrl = request.url()?.split("?")[0].split("#")[0];
    if (
      blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
      skippedResources.some((resource) => requestUrl.indexOf(resource) !== -1)
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

  try {
    await page.goto(url, {
      timeout: 15000,
      waitUntil: "domcontentloaded",
    });
  } catch (e) {
    console.error(e);
    hasPage = false;
  }

  return [hasPage, url];
};

export { goToPage };
