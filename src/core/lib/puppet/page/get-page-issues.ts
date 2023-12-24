import { kayle, Audit } from "kayle";
import type { IssueMeta } from "../../../../types";

const baseRunners = ["htmlcs", "axe"];
const DEFAULT_RUNNERS = process.env.DEFAULT_RUNNERS
  ? process.env.DEFAULT_RUNNERS.split(",")
  : [];
const dr = DEFAULT_RUNNERS.length
  ? DEFAULT_RUNNERS.filter((runner) =>
      ["htmlcs", "axe"].includes(runner)
    )
  : baseRunners;
const defaultRunners = dr.length ? dr : baseRunners;

const warningsEnabled = process.env.PAGEMIND_IGNORE_WARNINGS === "true" ? false : true;
// can set the lang based on kayle
const language = process.env.KAYLE_DEFAULT_LANG;

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
        includeWarnings: warningsEnabled,
        page,
        browser,
        actions,
        standard: wcagStandard || "WCAG2AA",
        ignore,
        language,
        rules,
        runners: runners && runners.length ? runners : defaultRunners, // default to include all runners
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
