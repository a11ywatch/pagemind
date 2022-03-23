export const getFirstItemBySplit = (className: string): string => {
  if (className) {
    return className.includes(",")
      ? className.substr(0, className.indexOf(","))
      : className;
  }
  return "";
};
