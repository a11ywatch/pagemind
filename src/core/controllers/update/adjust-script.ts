/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
import { format } from "prettier";
import { skipNavigationMethod, scriptBuild } from "../../../core/lib";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import path from "path";
import Piscina from "piscina";

const piscina = new Piscina({
  filename: path.resolve(__dirname, "cdn_worker.js"),
  env: {
    SCRIPTS_CDN_URL: process.env.SCRIPTS_CDN_URL,
  },
});

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

  resolver.script = format(scriptBody, {
    semi: true,
    parser: "html",
  });

  try {
    await piscina.run({
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
  } catch (e) {
    console.log(e, { type: "error" });
  }

  return resolver;
};
