import { a11y, Audit } from "a11y-js";
import { skipContentCheck } from "../skip-content-check";
import { skipContentTemplate } from "../../../controllers/update/templates";
import type { IssueMeta } from "../../../../types";

export const getPageIssues = async ({
  page,
  browser,
  actions = [],
  standard: wcagStandard,
  ignore,
  rules,
  runners,
  origin
}): Promise<[Audit | null, IssueMeta]> => {
  let results = null;

  try {
    // catch errors on long timeouts CDP close
    results = await a11y({
      includeNotices: false,
      includeWarnings: true,
      page,
      browser,
      actions,
      standard: wcagStandard || "WCAG2AA",
      ignore,
      rules,
      runners,
      origin
    });
  } catch (e) {
    console.error(e);
  }

  if (!results) {
    return [
      results,
      {
        skipContentIncluded: false,
      },
    ];
  }

  const skipContentIncluded =
    results.issues && (await skipContentCheck({ page }));

  if (!skipContentIncluded && results.issues) {
    results.issues.push(skipContentTemplate); // containers issues add skip content to end
    results.meta.warningCount += 1;
  }

  return [
    results,
    {
      skipContentIncluded,
    },
  ];
};
