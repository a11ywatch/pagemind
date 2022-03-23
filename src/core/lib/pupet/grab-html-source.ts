export const grabHtmlSource = async ({
  page,
}: {
  page: any;
}): Promise<[string, number]> => {
  try {
    return await page?.$eval(
      "html",
      (sources) =>
        [
          sources.outerHTML,
          window.performance.timing.domContentLoadedEventEnd -
            window.performance.timing.navigationStart,
        ] as const
    );
  } catch (e) {
    console.error(e);
    return ["", null];
  }
};
