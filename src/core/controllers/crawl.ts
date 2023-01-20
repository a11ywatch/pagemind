import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import type { Page } from "puppeteer";
import { performance } from "perf_hooks";
import {
  puppetPool,
  goToPage,
  getPageMeta,
  queueLighthouseUntilResults,
} from "../lib";
import { controller } from "../../proto/website-client";
import { getPageIssues } from "../lib/puppet/page/get-page-issues";
import { spoofPage } from "../lib/puppet/spoof";
import { setHtmlContent } from "../lib/puppet/page/go-to-page";
import { puppetFirefoxPool } from "../lib/puppet/create-puppeteer-pool-firefox";

export const crawlWebsite = async ({
  userId,
  url: urlMap,
  pageHeaders,
  pageInsights,
  scriptsEnabled, // gather js script
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

  try {
    page = await browser?.newPage();
  } catch (e) {
    console.error(e); // issue with creating a new page occurred [todo: fallback to outside remote chrome]
  }

  let duration = 0;
  let usage = 0;

  // handle the view port and ua for request
  if (page) {
    const { agent, vp } = spoofPage(mobile, ua);

    await Promise.all([page.setUserAgent(agent), page.setViewport(vp)]);

    usage = performance.now(); // page ttl
    hasPage = await (html
      ? setHtmlContent(page, html)
      : goToPage(page, urlMap)); // does the page exist
    duration = performance.now() - usage; // set the duration to time it takes to load page for ttyl
  }

  // todo: validate if being used twice at router level
  const { domain, pageUrl } = sourceBuild(urlMap);

  // if page did not succeed exit.
  if (!hasPage) {
    await pool.clean(page, browser);

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
      usage: duration + 0.25,
    };
  }

  const pageIssues = await getPageIssues({
    page,
    browser,
    pageHeaders,
    actions,
    standard,
    ignore,
    rules,
    runners, // set to undefined to use default
  });

  const [report, issueMeta] = pageIssues;

  let pageMeta = null;

  // valid page
  if (report) {
    // extra accessibility metrics
    pageMeta = await getPageMeta({ page, issues: report, scriptsEnabled, cv });
  }

  usage = performance.now() - usage; // get total uptime used

  await pool.clean(page, browser);

  const {
    errorCount,
    warningCount,
    noticeCount,
    accessScore,
    possibleIssuesFixedByCdn,
  } = pageMeta ?? {};

  // light house pageinsights
  if (report && pageInsights) {
    setImmediate(async () => {
      const insight = await queueLighthouseUntilResults({
        urlMap,
        apiKey: pageSpeedApiKey,
        host,
      });

      // catch error incase server is down or restarting for re-client connect
      try {
        await controller.addLighthouse({
          user_id: userId,
          insight,
          domain,
          url: urlMap,
        });
      } catch (e) {
        console.error(e);
      }
    });
  }

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
        possibleIssuesFixedByCdn: possibleIssuesFixedByCdn,
        totalIssues: report.issues.length,
        issuesFixedByCdn: possibleIssuesFixedByCdn || 0, // TODO: update confirmation
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
      issues: report.issues,
      documentTitle: report.documentTitle,
    },
    userId,
    usage,
  };
};
