export const checkCdn = async ({ page, cdnMinJsPath, cdnJsPath }) => {
  let hasCdn = false;
  const srcMin = decodeURIComponent(cdnMinJsPath);
  try {
    hasCdn = await page.$eval(`script[src$="${srcMin}"]`, (sources) => true);
  } catch (e) {}
  if (!hasCdn) {
    const src = decodeURIComponent(cdnJsPath);
    try {
      hasCdn = await page.$eval(`script[src$="${src}"]`, (sources) => true);
    } catch (e) {}
  }
  return hasCdn;
};
