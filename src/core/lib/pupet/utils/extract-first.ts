/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

export const getFirstItemBySplit = (className: string): string => {
  if (className) {
    return className.includes(",")
      ? className.substr(0, className.indexOf(","))
      : className;
  }
  return "";
};
