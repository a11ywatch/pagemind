import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import type { Page, CDPSession, BrowserContext } from "playwright";
import { puppetPool, getPageMeta, queueLighthouseUntilResults } from "../lib";
import { getPageIssues } from "../lib/puppet/page/get-page-issues";
import { spoofPage } from "../lib/puppet/spoof";
import { puppetFirefoxPool } from "../lib/puppet/create-puppeteer-pool-firefox";
import { getMetrics } from "../lib/puppet/metrics";
import { ScanRpcParams } from "../../types/types";
import { getWsEndPoint } from "../../config";

// manage shared connections
const sharedContext = new Map<string, { ctx: BrowserContext; size: number }>();

// get the shared contextID
const getSharedContextID = (
  params: Partial<ScanRpcParams> & { domain?: string }
) =>
  `${params.userId}_${params.domain}_${params.firefox}_${params.pageHeaders.length}`;

export const auditWebsite = async (params, retry?: boolean) => {
  const {
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
  } = params;
  // determine which pool to use
  const pool = firefox ? puppetFirefoxPool : puppetPool;
  const { browser, host } = await pool.acquire(!!retry);
  const { domain } = sourceBuild(urlMap);
  const sharedContextID = getSharedContextID({
    domain,
    userId,
    pageHeaders,
    firefox,
  });

  let page: Page = null;
  let context: { ctx: BrowserContext; size: number } = null;
  let client: CDPSession = null;
  let duration = 0;
  let usage = 0;

  // if not browser attempt reconnection
  if (browser) {
    const { agent, vp } = spoofPage(mobile, ua);

    if (!sharedContext.has(sharedContextID)) {
      try {
        const ctx = await browser?.newContext({
          userAgent: agent,
          viewport: vp.isMobile ? vp : undefined,
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

        // set the initial context
        sharedContext.set(sharedContextID, { ctx, size: 1 });
        context = sharedContext.get(sharedContextID);
      } catch (e) {
        if (e instanceof Error) {
          console.error(e ? e.message : "Browser page failed.");
          // fetching new browser instance
          await getWsEndPoint(true);
          // retry the method once after connecting to the next
          if (!retry) {
            return await auditWebsite(params, true);
          }
        }
      }
    } else {
      context = sharedContext.get(sharedContextID);
      if (context) {
        context.size++;
      }
    }

    // establish a new page
    if (context) {
      try {
        page = await context.ctx.newPage();
      } catch (e) {
        console.error(e);
      }
    }

    // establish CDP session
    if (page) {
      try {
        client = await page.context().newCDPSession(page);
        await client.send("Performance.enable");
      } catch (e) {
        console.error(e);
      }
    }
  }

  const pageIssues =
    page &&
    browser &&
    (await getPageIssues({
      page,
      browser,
      actions,
      standard,
      ignore,
      rules,
      runners, // set to undefined to use default
      origin: urlMap,
      html,
    }));

  const [report, issueMeta] = pageIssues;

  if (report) {
    // extra accessibility metrics
    await getPageMeta({ page, report, cv, client });
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

  if (context) {
    try {
      await page.close()
    } catch(e) {
      console.error(e)
    }
    
    context.size--;

    // if context is empty cleanup
    if (!context.size) {
      sharedContext.delete(sharedContextID);
      await puppetPool.clean(context.ctx);
    }
  }

  return {
    webPage: {
      domain,
      url: urlMap,
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
      pageUrl: urlMap,
      issues: (report && report.issues) || [],
      documentTitle: (report && report.documentTitle) || "",
    },
    userId,
    usage,
  };
};
