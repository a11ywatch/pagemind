import { sourceBuild } from "@a11ywatch/website-source-builder";
import { scriptBuild } from "../../lib/engine/build";
import { storeCDNValues } from "./cdn_worker";

export const editScript = async ({
  userId,
  url: urlMap,
  script: resolver,
  newScript,
}) => {
  const { domain, cdnSourceStripped } = sourceBuild(urlMap, userId);

  resolver.script = newScript;

  await storeCDNValues({
    cdnSourceStripped,
    scriptBody: scriptBuild(
      {
        scriptChildren: newScript,
        domain,
        cdnSrc: cdnSourceStripped,
      },
      true
    ),
    domain: domain || resolver?.domain,
  });

  return resolver;
};
