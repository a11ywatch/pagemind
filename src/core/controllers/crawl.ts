import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import type { Page } from "puppeteer";
import { performance } from "perf_hooks";
import {
  puppetPool,
  checkCdn,
  scriptBuild,
  goToPage,
  getPageMeta,
  queueLighthouseUntilResults,
} from "../lib";
import { storeCDNValues } from "./update/cdn_worker";
import { controller } from "../../proto/website-client";
import { getPageIssues } from "../lib/puppet/page/get-page-issues";
import { spoofPage } from "../lib/puppet/spoof";
import { setHtmlContent } from "../lib/puppet/page/go-to-page";
import { getCrawlDurationColor } from "../lib/utils/colors";
import { puppetFirefoxPool } from "../lib/puppet/create-puppeteer-pool-firefox";

export const crawlWebsite = async ({
  userId,
  url: urlMap,
  pageHeaders,
  pageInsights,
  noStore, // do not store any data
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

  // todo: opt into getting cdn paths
  const { domain, pageUrl, cdnSourceStripped, cdnJsPath, cdnMinJsPath } =
    sourceBuild(urlMap, userId);

  // if page did not succeed exit.
  if (!hasPage) {
    await pool.clean(page, browser);

    return {
      script: undefined,
      issues: undefined,
      webPage: {
        pageLoadTime: {
          duration: duration, // prevent empty durations
          durationFormated: getPageSpeed(duration),
          color: getCrawlDurationColor(duration),
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

  let pageHasCdn = false;
  let pageMeta = null;

  // valid page
  if (report) {
    // cdn for active acts
    const v = await Promise.all([
      !noStore
        ? checkCdn({ page, cdnMinJsPath, cdnJsPath })
        : Promise.resolve(null),
      getPageMeta({ page, issues: report, scriptsEnabled, cv }),
    ]);
    pageHasCdn = v[0];
    pageMeta = v[1];
  }

  usage = performance.now() - usage; // get total uptime used

  await pool.clean(page, browser);

  const {
    errorCount,
    warningCount,
    noticeCount,
    accessScore,
    scriptChildren,
    possibleIssuesFixedByCdn,
  } = pageMeta ?? {};

  let scriptProps = {}; // js script props
  let scriptBody = ""; // js script body
  let scriptData = {}; // script object

  // get script from accessibility engine
  if (scriptsEnabled) {
    scriptProps = {
      scriptChildren,
      domain,
      cdnSrc: cdnSourceStripped,
    };
    scriptBody = scriptBuild(scriptProps, true); // store body for cdn
    scriptData = {
      cdnUrlMinified: cdnMinJsPath,
      cdnUrl: cdnJsPath,
      cdnConnected: pageHasCdn,
      pageUrl,
      domain,
      script: scriptBody,
      issueMeta,
    };
  }

  // Store the js script
  if (!noStore) {
    setImmediate(async () => {
      await storeCDNValues({
        cdnSourceStripped,
        domain,
        scriptBody,
      });
    });
  }

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
      cdnConnected: pageHasCdn,
      pageLoadTime: {
        duration,
        durationFormated: getPageSpeed(duration),
        color: getCrawlDurationColor(duration),
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
    script: scriptData,
    userId,
    usage,
  };
};
