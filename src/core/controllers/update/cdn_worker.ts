import { controller } from "@app/proto/website-client";

export interface Resource {
  scriptBody?: string;
  domain: string;
  cdnSourceStripped?: string;
}

export const storeCDNValues = async ({
  scriptBody: scriptBuffer,
  cdnSourceStripped,
  domain,
}: Resource) => {
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
