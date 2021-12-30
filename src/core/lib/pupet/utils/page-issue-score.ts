/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

interface Params {
  html: string;
  element: any;
}

export const getPageIssueScore = ({ html, element }: Params): number => {
  if (element.type === "error") {
    if (html?.length >= 1000) {
      return 1;
    }
    return 2;
  }
  return 0;
};
