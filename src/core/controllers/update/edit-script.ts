/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { format } from "prettier";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { scriptBuild } from "../../../core/lib";

import { storeCDNValues } from "./cdn_worker";

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

  setImmediate(async () => {
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
      console.log(e, { type: "error" });
    }
  });

  return resolver;
};
