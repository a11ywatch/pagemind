import litepa11y from "litepa11y";
import { pa11yConfig } from "../../../../config";
import { skipContentCheck } from "../skip-content-check";
import { skipContentTemplate } from "../../../controllers/update/templates";
import { issueSort } from "../../utils/sort";
import type { PageIssues, IssueMeta } from "../../../../types";

export const getPageIssues = async ({
  urlPage,
  page,
  browser,
  pageHeaders,
  mobile,
  actions: pageActions,
  standard: wcagStandard,
  ua = "",
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

  let viewport;
  let results = null;

  if (mobile) {
    viewport = {
      width: 320,
      height: 480,
      deviceScaleFactor: 2,
      isMobile: true,
    };
  }

  let standard = "WCAG2AA";
  let actions = [];
  let userAgent = ua;

  // pass wcag standard
  if (
    wcagStandard &&
    ["WCAG2A", "WCAG2AA", "WCAG2AAAA"].includes(wcagStandard)
  ) {
    standard = wcagStandard;
  }

  // pass in actions if they exist
  if (pageActions && pageActions.length) {
    actions = pageActions;
  }

  try {
    results = await litepa11y(
      urlPage,
      Object.assign({}, pa11yConfig, pa11yHeaders, {
        ignoreUrl: true,
        page,
        browser,
        viewport,
        actions,
        standard,
        userAgent,
      })
    );
  } catch (e) {
    console.error(e);
  }

  // TODO: handle expensive function without xpath
  const skipContentIncluded = await skipContentCheck({ page });

  if (results) {
    const issueLength = results.issues?.length;

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
