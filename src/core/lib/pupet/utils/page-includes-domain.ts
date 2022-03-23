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
