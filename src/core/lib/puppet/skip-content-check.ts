import type { Page } from "puppeteer";

export const skipContentCheck = async ({
  page,
}: {
  page: Page;
}): Promise<boolean> => {
  let hasSkipContent = false;
  try {
    hasSkipContent = await page.evaluate(() => {
      const skipNameList = [
        "skip to main content",
        "skip to content",
        "skip navigation",
        "skip content",
        "skip navigation links",
        "skip main navigation",
      ];

      let matchFound = false;

      void (function skipAll(index = 0, type = "a") {
        const xpath = `//${type}[translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='${skipNameList[index]}']`;
        const matchingElement = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        if (!matchingElement) {
          const nextIndex = index + 1;

          if (nextIndex === skipNameList.length && type === "a") {
            index = 0;
            type = "button";
          }

          if (skipNameList[nextIndex]) {
            skipAll(nextIndex, type);
          }
        } else {
          matchFound = !!matchingElement;
        }
      })();

      return matchFound;
    });
  } catch (e) {
    console.error(e);
  }
  return hasSkipContent;
};
