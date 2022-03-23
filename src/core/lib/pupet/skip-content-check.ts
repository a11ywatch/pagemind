export const skipContentCheck = async ({
  page,
}: {
  page: any;
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
        "skip to bottom nav",
        "skip main navigation",
        "Skip navigation",
        "SKIP NAVIGATION",
      ];

      var matchFound: Node | boolean = false;
      var type = "button";

      void (function skipAll(index = 0) {
        const xpath = `//${type}[translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='${skipNameList[index]}']`;
        const matchingElement = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        if (!matchingElement) {
          if (index + 1 === skipNameList.length && type === "button") {
            index = -1;
            type = "a";
          }

          if (skipNameList[index + 1]) {
            skipAll(index + 1);
          }
        } else {
          matchFound = matchingElement;
        }
      })();

      return !!matchFound;
    });
  } catch (e) {
    console.error(e);
  }
  return hasSkipContent;
};
