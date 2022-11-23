import { pa11y } from "litepa11y";
import { pa11yConfig } from "../../../../config";
import { skipContentCheck } from "../skip-content-check";
import { skipContentTemplate } from "../../../controllers/update/templates";
import { issueSort } from "../../utils/sort";
import type { PageIssues, IssueMeta } from "../../../../types";

// desktop viewport
export const desktopViewport = {
  width: 1280,
  height: 1024,
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
  const pa11yHeaders = pageHeaders?.length
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

  const results = await pa11y(
    Object.assign({}, pa11yConfig, pa11yHeaders, {
      page,
      browser,
      actions,
      standard,
    })
  );

  // TODO: handle expensive function without xpath
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
