/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { getIssueFixScript } from "../../../lib";
import { getHostAsString } from "@a11ywatch/website-source-builder";
import {
  needsLongTextAlt,
  missingAltText,
  emptyIframeTitle,
  imgAltMissing,
} from "../../../strings";
import { grabAlt } from "./grab-alt";

interface IssueInfo {
  errorCount: number;
  warningCount: number;
  noticeCount: number;
  adaScore: number;
  scriptChildren: string;
  possibleIssuesFixedByCdn: number;
}

export const loopIssues = ({ issues, page }): Promise<IssueInfo> => {
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
      const extraConfig = await grabAlt({
        element,
        page,
      }).catch((e) => {
        console.error(e);
        return { alt: "" };
      });

      if (element.type === "error") {
        errorCount++;
        adaScore -= 2;
      }
      if (element.type === "warning") {
        warningCount++;
      }
      if (element.type === "notice") {
        noticeCount++;
      }

      if (
        !extraConfig?.alt &&
        [
          emptyIframeTitle,
          needsLongTextAlt,
          missingAltText,
          imgAltMissing,
          "Img element is marked so that it is ignored by Assistive Technology.",
        ].includes(element.message) &&
        !includeDomainCheck
      ) {
        includeDomainCheck = true;
      }

      const getFix = getIssueFixScript(element, issueIndex, extraConfig);

      if (getFix) {
        possibleIssuesFixedByCdn++;
        scriptChildren += getFix;
      }

      issueIndex++;
    }

    resolve({
      errorCount,
      warningCount,
      noticeCount,
      adaScore,
      scriptChildren: `${
        includeDomainCheck ? `${getHostAsString}` : ""
      }${scriptChildren}`,
      possibleIssuesFixedByCdn,
    });
  });
};
