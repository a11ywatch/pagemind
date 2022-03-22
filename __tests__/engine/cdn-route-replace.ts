import { cdnRouteReplaceHandler } from "../../src/core/lib/engine/templates/detect";

describe("CDN route replacer", () => {
  test("should replace script with current location", () => {
    const domain = "a11ywatch.com";
    const cdnSrc = "a11ywatch-com-ada-fix-1.min.js";
    const { currentPath, cdnSourceBase, cdnSourceEndTarget } =
      cdnRouteReplaceHandler({ domain, cdnSrc });

    const scriptsMatch = "/scripts";
    const cdnBasePath = cdnSourceBase.substring(
      cdnSourceBase.indexOf(scriptsMatch) + scriptsMatch.length
    );

    expect(currentPath).toBe("/");
    expect(cdnBasePath).toBe("/a11ywatch.com/a11ywatch-com");
    expect(cdnSourceEndTarget).toBe("-ada-fix-1.min.js");
  });

  test("should replace script with pathname and current location", () => {
    const domain = "a11ywatch.com";
    const cdnSrc = "a11ywatch-com-home-ada-fix-1.min.js";
    const { currentPath, cdnSourceBase, cdnSourceEndTarget } =
      cdnRouteReplaceHandler({ domain, cdnSrc });

    const scriptsMatch = "/scripts";
    const cdnBasePath = cdnSourceBase.substring(
      cdnSourceBase.indexOf(scriptsMatch) + scriptsMatch.length
    );

    expect(currentPath).toBe("/home");
    expect(cdnBasePath).toBe("/a11ywatch.com/a11ywatch-com-home");
    expect(cdnSourceEndTarget).toBe("-ada-fix-1.min.js");
  });
});
