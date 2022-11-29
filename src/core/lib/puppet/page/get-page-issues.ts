import { a11y } from "a11y-puppeteer";
import { a11yConfig } from "../../../../config";
import { skipContentCheck } from "../skip-content-check";
import { skipContentTemplate } from "../../../controllers/update/templates";
import { issueSort } from "../../utils/sort";
import type { PageIssues, IssueMeta } from "../../../../types";

// desktop viewport
export const desktopViewport = {
  width: 800,
  height: 600,
  deviceScaleFactor: undefined,
  isMobile: false,
};

// mobile viewpoer
export const mobileViewport = {
  width: 320,
  height: 480,
  deviceScaleFactor: 2,
  isMobile: true,
};

export const getPageIssues = async ({
  page,
  browser,
  pageHeaders,
  actions = [],
  standard: wcagStandard,
}): Promise<[PageIssues | null, IssueMeta]> => {
  const a11yHeaders = pageHeaders?.length
    ? {
        headers: pageHeaders.map((item: any) => {
          return {
            [item.key]: item.value,
          };
        }),
      }
    : {};

  let standard = "WCAG2AA";

  // pass wcag standard
  if (
    wcagStandard &&
    ["WCAG2A", "WCAG2AA", "WCAG2AAAA"].includes(wcagStandard)
  ) {
    standard = wcagStandard;
  }

  const results = await a11y(
    Object.assign({}, a11yConfig, a11yHeaders, {
      page,
      browser,
      actions,
      standard,
    })
  );

  const skipContentIncluded = await skipContentCheck({ page });

  if (results) {
    const issueLength = results?.issues?.length;

    if (!skipContentIncluded) {
      if (issueLength) {
        results.issues.push(skipContentTemplate); // containers issues add skip content to end
      } else {
        results.issues = [skipContentTemplate];
      }
    }

    if (issueLength) {
      results.issues.sort(issueSort);
    }
  }

  return [
    results,
    {
      skipContentIncluded,
    },
  ];
};
