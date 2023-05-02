import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import type { Page } from "puppeteer";
import {
  puppetPool,
  goToPage,
  getPageMeta,
  queueLighthouseUntilResults,
} from "../lib";
import { getPageIssues } from "../lib/puppet/page/get-page-issues";
import { spoofPage } from "../lib/puppet/spoof";
import { setHtmlContent } from "../lib/puppet/page/go-to-page";
import { puppetFirefoxPool } from "../lib/puppet/create-puppeteer-pool-firefox";
import { a11yConfig } from "../../config/a11y-config";

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
  let hasPage = false;
  let duration = 0;
  let usage = 0;

  try {
    page = await browser?.newPage();
  } catch (e) {
    console.error(e); // issue with creating a new page occurred [todo: fallback to outside remote chrome]
  }

  const { domain, pageUrl } = sourceBuild(urlMap);

  // handle the view port and ua for request
  if (page) {
    const { agent, vp } = spoofPage(mobile, ua);
    try {
      await Promise.all([
        pageHeaders.length
          ? page.setExtraHTTPHeaders(
              pageHeaders.reduce(
                (
                  a,
                  item: {
                    key: string;
                    value: string;
                  }
                ) => ({ ...a, [item.key]: item.value }),
                {}
              )
            )
          : Promise.resolve(),
        page.setUserAgent(agent),
        page.setViewport(vp),
      ]);
    } catch (e) {
      console.error(e);
    }

    let pageRedirected = false;

    page.on("response", (response) => {
      const status = response.status();

      if (status >= 300 && status <= 399) {
        pageRedirected = true;
      }
    });

    // not closed run scans
    if (!page.isClosed()) {
      if (html) {
        hasPage = await setHtmlContent(
          page,
          html, /// allow resources to load for the frame
          `${
            urlMap && urlMap.startsWith("https") ? "https" : "http"
          }://${domain}`
        );
      } else {
        hasPage = await goToPage(page, urlMap);
      }

      if (pageRedirected) {
        try {
          // wait for html if goto used. todo: html should use networkidle2
          await page.waitForSelector("html", {
            timeout: a11yConfig.timeout,
          });
        } catch (e) {
          hasPage = false;
        }
      }
      page.removeAllListeners("response");
    }
  }

  // if page did not succeed exit.
  if (!hasPage) {
    await pool.clean(page);

    try {
      const metrics = await page.metrics();

      const {
        TaskDuration,
        ScriptDuration,
        RecalcStyleDuration,
        LayoutDuration,
      } = metrics;

      duration = (ScriptDuration + RecalcStyleDuration + LayoutDuration) * 1000;
      usage = TaskDuration * 1000;
    } catch (e) {
      console.error(e);
    }

    return {
      issues: undefined,
      webPage: {
        pageLoadTime: {
          duration: duration, // prevent empty durations
          durationFormated: getPageSpeed(duration),
        },
        domain,
        url: urlMap,
        insight: undefined,
        issuesInfo: undefined,
        lastScanDate: new Date().toISOString(),
      },
      userId,
      usage,
    };
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
  });

  const [report, issueMeta] = pageIssues;

  if (report) {
    // extra accessibility metrics
    await getPageMeta({ page, report, cv });
  }

  try {
    const metrics = await page.metrics();

    const {
      TaskDuration,
      ScriptDuration,
      RecalcStyleDuration,
      LayoutDuration,
    } = metrics;

    duration = (ScriptDuration + RecalcStyleDuration + LayoutDuration) * 1000;
    usage = TaskDuration * 1000;
  } catch (e) {
    console.error(e);
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
