import { sourceBuild } from "@a11ywatch/website-source-builder";
import { scriptBuild } from "@app/core/lib/engine/build";
import { storeCDNValues } from "./cdn_worker";

export const editScript = async ({
  userId,
  url: urlMap,
  script: resolver,
  newScript,
}) => {
  const { domain, cdnSourceStripped } = sourceBuild(urlMap, userId);

  resolver.script = newScript;

  try {
    await storeCDNValues({
      cdnSourceStripped,
      scriptBody: scriptBuild(
        {
          scriptChildren: newScript
            .replace("<script defer>", "")
            .replace("</script>", ""),
          domain,
          cdnSrc: cdnSourceStripped,
        },
        true
      ),
      domain: domain || resolver?.domain,
    });
  } catch (e) {
    console.error(e);
  }

  return resolver;
};
