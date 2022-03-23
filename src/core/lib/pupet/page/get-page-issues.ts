import litepa11y from "litepa11y";
import { pa11yConfig } from "../../../../config";
import { skipContentCheck } from "../..";
import { skipContentTemplate } from "../../../controllers/update/templates";
import { issueSort } from "../../../lib/utils/sort";
import type { PageIssues, IssueMeta } from "../../../../types";

export const getPageIssues = async ({
  urlPage,
  page,
  browser,
  pageHeaders,
}): Promise<[PageIssues, IssueMeta]> => {
  const pa11yHeaders = pageHeaders?.length
    ? {
        headers: pageHeaders.map((item: any) => {
          return {
            [item.key]: item.value,
          };
        }),
      }
    : {};

  try {
    const issues = await litepa11y(
      urlPage,
      Object.assign({}, pa11yConfig, pa11yHeaders, {
        ignoreUrl: true,
        page,
        browser,
      })
    );

    const skipContentIncluded = await skipContentCheck({ page });

    if (issues && !skipContentIncluded) {
      if (issues.issues?.length) {
        issues.issues.push(skipContentTemplate);
      } else {
        issues.issues = [skipContentTemplate];
      }
      // TODO: look into grabbing in order from instance
      issues.issues.sort(issueSort);
    }

    return [
      issues,
      {
        skipContentIncluded,
      },
    ];
  } catch (e) {
    console.log(e);
    return [{}, { skipContentIncluded: false }];
  }
};
