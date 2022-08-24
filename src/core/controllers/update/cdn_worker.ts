import { controller } from "@app/proto/website-client";

export interface Resource {
  scriptBody?: string;
  domain: string;
  cdnSourceStripped?: string;
}

// not a worker but, sends values to the cdn server
export const storeCDNValues = async ({
  scriptBody: scriptBuffer,
  cdnSourceStripped,
  domain,
}: Resource) => {
  await controller.addScript({
    scriptBuffer,
    cdnSourceStripped,
    domain,
  });
};
