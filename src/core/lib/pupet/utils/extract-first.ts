export const getFirstItemBySplit = (className: string): string => {
  if (className) {
    return className.includes(",") ? className.split(",")[0] : className;
  }
  return "";
};
