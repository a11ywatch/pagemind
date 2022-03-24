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
      waitUntil: "load",
    });
  } catch (e) {
    console.error(e);
    hasPage = false;
  }

  return [hasPage, url];
};

export { goToPage };
