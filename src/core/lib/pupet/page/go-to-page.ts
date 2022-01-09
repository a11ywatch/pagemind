/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { pa11yConfig } from "../../../../config";
import type { Page } from "puppeteer";

const goToPage = async (
  page: Page,
  url: string
): Promise<[boolean, string]> => {
  let hasPage = true;

  try {
    await page.goto(url, {
      timeout: pa11yConfig.timeout,
      waitUntil: "domcontentloaded",
    });
  } catch (e) {
    console.error(e);
    hasPage = false;
  }

  return [hasPage, url];
};

export { goToPage };
