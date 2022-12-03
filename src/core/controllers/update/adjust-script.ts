import { sourceBuild } from "@a11ywatch/website-source-builder";
import { skipNavigationMethod, scriptBuild } from "../../../core/lib";
import { storeCDNValues } from "./cdn_worker";

export const adjustScript = async ({ url: urlMap, script: resolver }) => {
  const enabledSkip = resolver?.scriptMeta?.skipContentEnabled;
  const { domain, cdnSourceStripped } = sourceBuild(urlMap);

  let scriptBody: string = resolver?.script || "";

  if (scriptBody) {
    const startOfReplaceScript = scriptBody.indexOf("// SO: SKIP NAVIGATION");
    const endOfReplaceScript = scriptBody.indexOf("// EO: SKIP NAVIGATION");

    if (!enabledSkip) {
      if (scriptBody.includes("// SO: SKIP NAVIGATION")) {
        scriptBody =
          scriptBody.substring(0, startOfReplaceScript) +
          scriptBody
            .substring(endOfReplaceScript + "// EO: SKIP NAVIGATION".length)
            .trim();
      }
    } else if (scriptBody.includes("// SO: SKIP NAVIGATION") === false) {
      scriptBody = scriptBody.replace(
        "void function init() {",
        `void function init() { \n ${skipNavigationMethod}`
      );
    }
  }

  resolver.script = scriptBody;

  await storeCDNValues({
    cdnSourceStripped,
    scriptBody: scriptBuild(
      {
        scriptChildren: scriptBody,
        domain,
        cdnSrc: cdnSourceStripped,
      },
      true
    ),
    domain: domain || resolver?.domain,
  });

  return resolver;
};
