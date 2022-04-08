interface Params {
  element: any;
}

export const getPageIssueScore = ({ element }: Params): number => {
  if (element.type === "error") {
    return 2;
  }
  return 0;
};
