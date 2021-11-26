/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import pa11y from "pa11y";
import { pa11yConfig } from "../../../../config";
import { skipContentCheck } from "../../../lib";
import { skipContentTemplate } from "../templates";
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
    const issues = await pa11y(
      urlPage,
      Object.assign({}, pa11yConfig, pa11yHeaders, {
        ignoreUrl: true,
        page,
        browser,
      }) as any
    );
    const skipContentIncluded = await skipContentCheck({ page });

    if (issues && !skipContentIncluded) {
      if (issues.issues?.length) {
        issues.issues.push(skipContentTemplate);
      } else {
        issues.issues = [skipContentTemplate];
      }
    }

    return [
      issues as any,
      {
        skipContentIncluded,
      },
    ];
  } catch (e) {
    console.log(e);
    return [{}, { skipContentIncluded: false }];
  }
};
