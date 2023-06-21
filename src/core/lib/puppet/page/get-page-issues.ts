import { kayle, Audit } from "kayle";
import type { IssueMeta } from "../../../../types";

export const getPageIssues = async ({
  page,
  browser,
  actions = [],
  standard: wcagStandard,
  ignore,
  rules,
  runners,
  origin,
  html,
}): Promise<[Audit | null, IssueMeta]> => {
  let results = null;

  try {
    // catch errors on long timeouts CDP close
    results = await kayle(
      {
        includeNotices: false,
        includeWarnings: true,
        page,
        browser,
        actions,
        standard: wcagStandard || "WCAG2AA",
        ignore,
        rules,
        runners: runners && runners.length ? runners : ["htmlcs", "axe"], // default to include all runners
        origin,
        html,
        waitUntil: "domcontentloaded",
      },
      true
    );
  } catch (e) {
    console.error(e);
  }

  return [
    results,
    {
      skipContentIncluded: true,
    },
  ];
};
