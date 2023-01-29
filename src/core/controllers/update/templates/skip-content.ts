import type { Issue } from "a11y-js";

export const skipContentTemplate: Issue = {
  code: "WCAG2A.Principle1.Guideline2.4",
  type: "warning",
  typeCode: 2,
  message:
    "Skip to content link not found. Use skip to content links to help shortcut to the main content.",
  context: '<a id="content">Skip Content</a>',
  selector: "a",
  runner: "a11ywatch",
  runnerExtras: {},
  recurrence: 0,
};
