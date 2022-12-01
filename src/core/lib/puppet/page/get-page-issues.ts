import { a11y } from "a11y-puppeteer";
import { a11yConfig } from "../../../../config";
import { skipContentCheck } from "../skip-content-check";
import { skipContentTemplate } from "../../../controllers/update/templates";
import { issueSort } from "../../utils/sort";
import type { PageIssues, IssueMeta } from "../../../../types";

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

  const results = await a11y(
    Object.assign({}, a11yConfig, a11yHeaders, {
      page,
      browser,
      actions,
      standard: wcagStandard || "WCAG2AA",
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
