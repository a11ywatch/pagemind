import litepa11y from "litepa11y";
import { pa11yConfig } from "../../../../config";
import { skipContentCheck } from "../skip-content-check";
import { skipContentTemplate } from "../../../controllers/update/templates";
import { issueSort } from "../../../lib/utils/sort";
import type { PageIssues, IssueMeta } from "../../../../types";

export const getPageIssues = async ({
  urlPage,
  page,
  browser,
  pageHeaders,
  mobile,
  actions: pageActions,
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

  let results;
  let viewport;

  if (mobile) {
    viewport = {
      width: 320,
      height: 480,
      deviceScaleFactor: 2,
      isMobile: true,
    };
  }

  let standard;
  let actions;

  // pass wcag standard
  if (wcagStandard) {
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
      })
    );
  } catch (e) {
    // TODO: fallback to linter
    console.error(e);
  }

  let skipContentIncluded = false;

  try {
    skipContentIncluded = await skipContentCheck({ page });
  } catch (e) {
    console.error(e);
  }

  if (results) {
    const issueLength = results.issues?.length;

    if (!skipContentIncluded) {
      // containers issues add skip content to end
      if (issueLength) {
        results.issues.push(skipContentTemplate);
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
