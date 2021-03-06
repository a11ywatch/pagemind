import { getIssueFixScript } from "../..";
import { getHostAsString } from "@a11ywatch/website-source-builder";
import { getAltImage, isAltMissing } from "./grab-alt";
import { getPageIssueScore } from "../utils/page-issue-score";
import { getIncludesDomain } from "../utils/page-includes-domain";

interface IssueInfo {
  errorCount: number;
  warningCount: number;
  noticeCount: number;
  adaScore: number;
  scriptChildren: string;
  possibleIssuesFixedByCdn: number;
  scriptsEnabled?: boolean;
  cv?: boolean; // can use computer vision
}

export const getPageMeta = ({
  issues,
  page,
  scriptsEnabled,
  cv,
}): Promise<IssueInfo> => {
  let errorCount = 0;
  let warningCount = 0;
  let noticeCount = 0;
  let adaScore = 100;
  let scriptChildren = ``;
  let possibleIssuesFixedByCdn = 0;
  let includeDomainCheck = false;

  const pageIssues = (issues && issues?.issues) || [];

  return new Promise(async (resolve) => {
    if (!pageIssues?.length) {
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
    let index = 0;
    for (let element of pageIssues) {
      let extraConfig;

      // element contains alt tag related error message and reload the page if issues exist.
      if (isAltMissing(element.message)) {
        extraConfig = await getAltImage({
          element,
          page,
          index,
          cv,
        }).catch((e) => {
          console.error(e);
        });

        const altFix = extraConfig?.alt;

        if (altFix) {
          // if alt exist apply recommendation.
          element.message = `${element.message} Recommendation: change alt to ${altFix}.`;
        }

        index++;
      }

      // the name of the domain should be used like a Logo. Only run if alt is not returned
      if (
        getIncludesDomain({ alt: extraConfig?.alt, message: element.message })
      ) {
        includeDomainCheck = true;
      }

      if (scriptsEnabled) {
        // get the js fix for the page
        const getFix = getIssueFixScript(element, issueIndex, extraConfig);

        if (getFix) {
          possibleIssuesFixedByCdn++;
          scriptChildren += getFix;
        }
      }

      if (element.type === "error") {
        errorCount++;
      } else if (element.type === "warning") {
        warningCount++;
      } else if (element.type === "notice") {
        noticeCount++;
      }

      adaScore -= getPageIssueScore({ element });

      issueIndex++;
    }

    resolve({
      errorCount,
      warningCount,
      noticeCount,
      adaScore: Math.max(0, adaScore),
      scriptChildren: scriptsEnabled
        ? `${includeDomainCheck ? getHostAsString : ""}${scriptChildren}`
        : null,
      possibleIssuesFixedByCdn,
    });
  });
};
