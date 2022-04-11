import { controller } from "@app/proto/website-client";

export interface Resource {
  scriptBody?: string;
  domain: string;
  cdnSourceStripped?: string;
  screenshot?: string | Buffer;
  screenshotStill?: string;
}

export const storeCDNValues = async ({
  scriptBody: scriptBuffer,
  cdnSourceStripped,
  domain,
  screenshot,
  screenshotStill,
}: Resource) => {
  try {
    await controller.addScreenshot({
      cdnSourceStripped,
      domain,
      screenshot,
      screenshotStill,
    });
  } catch (e) {
    console.log(e);
  }
  try {
    await controller.addScript({
      scriptBuffer,
      cdnSourceStripped,
      domain,
    });
  } catch (e) {
    console.log(e);
  }
};
