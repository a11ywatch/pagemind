/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { format } from "prettier";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { scriptBuild } from "../../../core/lib";
import path from "path";
import Piscina from "piscina";

const piscina = new Piscina({
  filename: path.resolve(__dirname, "cdn_worker.js"),
  env: {
    SCRIPTS_CDN_URL: process.env.SCRIPTS_CDN_URL,
  },
});

export const editScript = async ({
  userId,
  url: urlMap,
  script: resolver,
  newScript,
}) => {
  const { domain, cdnSourceStripped } = sourceBuild(urlMap, userId);

  resolver.script = format(newScript, {
    semi: true,
    parser: "html",
  });

  try {
    await piscina.run({
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
    console.log(e, { type: "error" });
  }

  return resolver;
};
