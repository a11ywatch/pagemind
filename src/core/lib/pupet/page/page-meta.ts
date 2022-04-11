import { getIssueFixScript } from "../..";
import { getHostAsString } from "@a11ywatch/website-source-builder";
import { getAltImage } from "./grab-alt";
import { getPageIssueScore } from "../utils/page-issue-score";
import { getIncludesDomain } from "../utils/page-includes-domain";
import { missingAltText } from "@app/core/strings";

interface IssueInfo {
  errorCount: number;
  warningCount: number;
  noticeCount: number;
  adaScore: number;
  scriptChildren: string;
  possibleIssuesFixedByCdn: number;
}

export const getPageMeta = ({ issues, page }): Promise<IssueInfo> => {
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

    for (let element of pageIssues) {
      const extraConfig = await getAltImage({
        element,
        page,
      }).catch((e) => {
        console.error(e);
        return { alt: "" };
      });

      const altFix = extraConfig?.alt;

      if (altFix && element.message.includes(missingAltText)) {
        element.message = `${element.message} Try setting the alt prop to ${altFix}.`;
        element.context = `${element.context.replace(
          ">",
          ` alt="${altFix}">`
        )}`;
      }

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

      adaScore -= getPageIssueScore({ element });

      issueIndex++;
    }

    resolve({
      errorCount,
      warningCount,
      noticeCount,
      adaScore: Math.max(0, adaScore),
      scriptChildren: `${
        includeDomainCheck ? getHostAsString : ""
      }${scriptChildren}`,
      possibleIssuesFixedByCdn,
    });
  });
};
