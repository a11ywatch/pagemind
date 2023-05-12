import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import type { Page, CDPSession } from "playwright";
import { puppetPool, getPageMeta, queueLighthouseUntilResults } from "../lib";
import { getPageIssues } from "../lib/puppet/page/get-page-issues";
import { spoofPage } from "../lib/puppet/spoof";
import { puppetFirefoxPool } from "../lib/puppet/create-puppeteer-pool-firefox";
import { getMetrics } from "./metrics";

export const auditWebsite = async ({
  userId,
  url: urlMap,
  pageHeaders,
  pageInsights,
  mobile, // mobile view port
  actions,
  standard,
  ua,
  cv,
  pageSpeedApiKey,
  html,
  firefox, // experimental
  ignore,
  rules,
  runners = [],
}) => {
  // determine which pool to use
  const pool = firefox ? puppetFirefoxPool : puppetPool;

  const { browser, host } = await pool.acquire(false);

  let page: Page = null;
  let duration = 0;
  let usage = 0;

  const { domain, pageUrl } = sourceBuild(urlMap);

  // handle the view port and ua for request
  if (browser) {
    const { agent, vp } = spoofPage(mobile, ua);

    try {
      page = await browser?.newPage({
        userAgent: agent,
        viewport: vp,
        extraHTTPHeaders: pageHeaders.length
          ? pageHeaders.reduce(
              (
                a,
                item: {
                  key: string;
                  value: string;
                }
              ) => ({ ...a, [item.key]: item.value }),
              {}
            )
          : undefined,
      });
    } catch (e) {
      if (e instanceof Error) {
        console.error(`browser new page failed: ${e.message}`);
      } else {
        console.error("browser new page failed.");
      }
    }
  }

  let client: CDPSession;

  try {
    // todo: get prior client
    client = await page.context().newCDPSession(page);
    await client.send("Performance.enable");
  } catch (e) {
    console.error(e);
  }

  const pageIssues = await getPageIssues({
    page,
    browser,
    actions,
    standard,
    ignore,
    rules,
    runners, // set to undefined to use default
    origin: html && pageUrl ? pageUrl : undefined,
    html,
  });

  const [report, issueMeta] = pageIssues;

  if (report) {
    // extra accessibility metrics
    await getPageMeta({ page, report, cv });
  }

  const { errorCount, warningCount, noticeCount, accessScore } =
    report?.meta ?? {};

  // light house pageinsights
  if (report && pageInsights) {
    setImmediate(async () => {
      await queueLighthouseUntilResults({
        urlMap,
        apiKey: pageSpeedApiKey,
        host,
        userId: userId,
        domain,
      });
    });
  }

  try {
    const metrics = await getMetrics(client);

    // get the duration of the page
    duration =
      (metrics.ScriptDuration +
        metrics.RecalcStyleDuration +
        metrics.LayoutDuration) *
      1000;

    usage = metrics.TaskDuration * 1000;
  } catch (e) {
    console.error(e);
  }

  await pool.clean(page);

  return {
    webPage: {
      domain,
      url: pageUrl,
      pageLoadTime: {
        duration,
        durationFormated: getPageSpeed(duration),
      },
      insight: null,
      issuesInfo: {
        possibleIssuesFixedByCdn: 0, // TODO: remove field
        issuesFixedByCdn: 0, // TODO: remove field
        totalIssues: errorCount + warningCount + noticeCount,
        errorCount,
        warningCount,
        noticeCount,
        accessScore,
        issueMeta,
      },
      lastScanDate: new Date().toISOString(),
    },
    issues: {
      domain,
      pageUrl,
      issues: (report && report.issues) || [],
      documentTitle: (report && report.documentTitle) || "",
    },
    userId,
    usage,
  };
};
