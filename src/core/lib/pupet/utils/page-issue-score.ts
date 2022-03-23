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
