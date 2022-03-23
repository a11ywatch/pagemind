type Issue = {
  selector?: string;
};

type GetSelectorReturn = "getElementById" | "querySelector";

export const getSelectorType = (issue?: Issue): GetSelectorReturn =>
  issue?.selector?.length &&
  issue?.selector[0] === "#" &&
  !(issue?.selector.indexOf(" ") >= 0)
    ? "getElementById"
    : "querySelector";
