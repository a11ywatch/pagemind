import { getPageIssueScore } from "../utils/page-issue-score";
import { getAltImage, isAltMissing } from "./grab-alt";

interface IssueInfo {
  errorCount: number;
  warningCount: number;
  noticeCount: number;
  accessScore: number;
  possibleIssuesFixedByCdn: number;
  scriptsEnabled?: boolean;
  cv?: boolean; // can use computer vision
}

// disable AI for getting page alt images
const AI_DISABLED = process.env.AI_DISABLED === "true";

export const getPageMeta = ({
  issues,
  page,
  cv,
}): Promise<IssueInfo> => {
  let errorCount = 0;
  let warningCount = 0;
  let noticeCount = 0;
  let accessScore = 100;
  let possibleIssuesFixedByCdn = 0;

  const pageIssues = (issues && issues?.issues) || [];

  return new Promise(async (resolve) => {
    if (!pageIssues?.length) {
      resolve({
        errorCount,
        warningCount,
        noticeCount,
        accessScore,
        possibleIssuesFixedByCdn,
      });
    }

    let index = 0;

    for (let element of pageIssues) {
      let extraConfig;

      // element contains alt tag related error message and reload the page if issues exist.
      if (!AI_DISABLED && isAltMissing(element.message)) {
        extraConfig = await getAltImage({
          element,
          page,
          index,
          cv,
        }).catch((e) => {
          console.error(e);
        });

        const altFix = extraConfig?.alt;

        // if alt exist apply recommendation.
        if (altFix) {
          element.message = `${element.message} Recommendation: change alt to ${altFix}.`;
        }

        index++;
      }

      if (element.type === "error") {
        errorCount++;
      } else if (element.type === "warning") {
        warningCount++;
      } else if (element.type === "notice") {
        noticeCount++;
      }

      accessScore -= getPageIssueScore({ element });
    }

    resolve({
      accessScore: Math.max(0, accessScore),
      errorCount,
      warningCount,
      noticeCount,
      possibleIssuesFixedByCdn,
    });
  });
};
