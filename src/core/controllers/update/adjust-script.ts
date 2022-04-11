import { skipNavigationMethod, scriptBuild } from "@app/core/lib";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { storeCDNValues } from "./cdn_worker";

export const adjustScript = async ({ url: urlMap, script: resolver }) => {
  const enabledSkip = resolver?.scriptMeta?.skipContentEnabled;
  const { domain, cdnSourceStripped } = sourceBuild(urlMap);

  let scriptBody = resolver?.script;

  if (scriptBody) {
    const startOfReplaceScript = scriptBody.indexOf("// SO: SKIP NAVIGATION");
    const endOfReplaceScript = scriptBody.indexOf("// EO: SKIP NAVIGATION");
    if (!enabledSkip) {
      scriptBody =
        scriptBody.substr(0, startOfReplaceScript) +
        scriptBody.substr(endOfReplaceScript + "// EO: SKIP NAVIGATION".length);
    } else {
      scriptBody = scriptBody.replace(
        "void (function init() {",
        `void (function init() { \n ${skipNavigationMethod}`
      );
    }
  }

  resolver.script = scriptBody;

  await storeCDNValues({
    cdnSourceStripped,
    scriptBody: scriptBuild(
      {
        scriptChildren: scriptBody
          .replace("<script defer>", "")
          .replace("</script>", ""),
        domain,
        cdnSrc: cdnSourceStripped,
      },
      true
    ),
    domain: domain || resolver?.domain,
  });

  return resolver;
};
