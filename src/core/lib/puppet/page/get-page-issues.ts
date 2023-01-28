import { a11y } from "a11y-js";
import { skipContentCheck } from "../skip-content-check";
import { skipContentTemplate } from "../../../controllers/update/templates";
import type { PageIssues, IssueMeta } from "../../../../types";

export const getPageIssues = async ({
  page,
  browser,
  pageHeaders,
  actions = [],
  standard: wcagStandard,
  ignore,
  rules,
  runners,
}): Promise<[PageIssues | null, IssueMeta]> => {
  const results = await a11y({
    includeNotices: false,
    includeWarnings: true,
    page,
    browser,
    actions,
    standard: wcagStandard || "WCAG2AA",
    ignore,
    rules,
    runners,
    headers: pageHeaders?.length
      ? pageHeaders.map((item: any) => ({
          [item.key]: item.value,
        }))
      : undefined,
  });

  const skipContentIncluded = results && results.issues && (await skipContentCheck({ page }));

  if (results && !skipContentIncluded) {
    results.issues.push(skipContentTemplate); // containers issues add skip content to end
  }

  return [
    results,
    {
      skipContentIncluded,
    },
  ];
};
