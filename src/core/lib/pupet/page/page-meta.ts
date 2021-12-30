/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { getIssueFixScript } from "../..";
import { getHostAsString } from "@a11ywatch/website-source-builder";
import { getAltImage } from "./grab-alt";
import { getPageIssueScore } from "../utils/page-issue-score";
import { getIncludesDomain } from "../utils/page-includes-domain";

interface IssueInfo {
  errorCount: number;
  warningCount: number;
  noticeCount: number;
  adaScore: number;
  scriptChildren: string;
  possibleIssuesFixedByCdn: number;
}

export const getPageMeta = ({ issues, page, html }): Promise<IssueInfo> => {
  let errorCount = 0;
  let warningCount = 0;
  let noticeCount = 0;
  let adaScore = 100;
  let scriptChildren = ``;
  let possibleIssuesFixedByCdn = 0;
  let includeDomainCheck = false;

  return new Promise(async (resolve) => {
    if (!issues?.issues?.length) {
      resolve({
        errorCount,
        warningCount,
        noticeCount,
        adaScore,
        scriptChildren,
        possibleIssuesFixedByCdn,
      });
    }

    let issueIndex = 0;

    for await (const element of issues.issues) {
      const extraConfig = await getAltImage({
        element,
        page,
      }).catch((e) => {
        console.error(e);
        return { alt: "" };
      });
      const getFix = getIssueFixScript(element, issueIndex, extraConfig);

      if (
        getIncludesDomain({ alt: extraConfig?.alt, message: element.message })
      ) {
        includeDomainCheck = true;
      }

      if (getFix) {
        possibleIssuesFixedByCdn++;
        scriptChildren += getFix;
      }

      if (element.type === "error") {
        errorCount++;
      } else if (element.type === "warning") {
        warningCount++;
      } else if (element.type === "notice") {
        noticeCount++;
      }

      adaScore -= getPageIssueScore({ html, element });
      issueIndex++;
    }

    resolve({
      errorCount,
      warningCount,
      noticeCount,
      adaScore,
      scriptChildren: `${
        includeDomainCheck ? getHostAsString : ""
      }${scriptChildren}`,
      possibleIssuesFixedByCdn,
    });
  });
};
