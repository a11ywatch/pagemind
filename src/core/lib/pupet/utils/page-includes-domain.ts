/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import {
  needsLongTextAlt,
  missingAltText,
  emptyIframeTitle,
  imgAltMissing,
  imgMarkedAssertive,
} from "../../../strings";

interface Params {
  alt?: string;
  message?: string;
}

// determine if current page matches domain
export const getIncludesDomain = ({ alt, message }: Params): boolean => {
  let includeDomainCheck = false;
  if (
    !alt &&
    [
      emptyIframeTitle,
      needsLongTextAlt,
      missingAltText,
      imgAltMissing,
      imgMarkedAssertive,
    ].includes(message)
  ) {
    includeDomainCheck = true;
  }

  return includeDomainCheck;
};
