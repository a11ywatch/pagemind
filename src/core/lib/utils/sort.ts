interface ResultIssue {
  code: string;
  context: string;
  message: string;
  selector: string;
  type: string;
  typeCode: number;
}

export const issueSort = (a: ResultIssue, b: ResultIssue) => {
  if (a.type === "error" && b.type !== "error") {
    return -1;
  }
  if (a.type === "warning" && b.type !== "error") {
    return -2;
  }
  return 0;
};
