import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import type { Browser, Page } from "puppeteer";
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
import {
  mobileViewport,
  desktopViewport,
  getPageIssues,
} from "../lib/puppet/page/get-page-issues";

// disc the browser socket req
const cleanPool = async (browser?: Browser, page?: Page) =>
  await puppetPool.clean(page, browser);

// duration color
const getCrawlDurationColor = (duration: number) =>
  duration <= 1500 ? "#A5D6A7" : duration <= 3000 ? "#E6EE9C" : "#EF9A9A";

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
}) => {
  const { browser, host } = await puppetPool.acquire();
  const page: Page = await browser.newPage();

  await Promise.all([
    ua ? page.setUserAgent(ua) : Promise.resolve(null),
    page.setViewport(mobile ? mobileViewport : desktopViewport),
  ]);

  let duration = performance.now(); // page ttl
  const hasPage = await goToPage(page, urlMap); // does the page exist

  // todo: opt into getting cdn paths
  const { domain, pageUrl, cdnSourceStripped, cdnJsPath, cdnMinJsPath } =
    sourceBuild(urlMap, userId);

  // if page did not succeed exit.
  if (!hasPage) {
    duration = performance.now() - duration; // set the duration to time it takes to load page for ttyl
    await cleanPool(browser, page);

    return {
      script: null,
      issues: null,
      webPage: {
        pageLoadTime: {
          duration,
          durationFormated: getPageSpeed(duration),
          color: getCrawlDurationColor(duration),
        },
        domain,
        url: urlMap,
        insight: null,
        issuesInfo: null,
        lastScanDate: new Date().toISOString(),
      },
      userId,
    };
  }

  const pageIssues = await getPageIssues({
    page,
    browser,
    pageHeaders,
    actions,
    standard,
  });

  // calculate duration after gathering page insight and running custom cmds
  duration = performance.now() - duration;

  const [issues, issueMeta] = pageIssues;

  let pageHasCdn = false;
  let pageMeta = null;

  // valid page
  if (issues) {
    // cdn for active acts
    const v = await Promise.all([
      !noStore
        ? checkCdn({ page, cdnMinJsPath, cdnJsPath })
        : Promise.resolve(null),
      getPageMeta({ page, issues, scriptsEnabled, cv }),
    ]);
    pageHasCdn = v[0];
    pageMeta = v[1];
  }

  await cleanPool(browser, page);

  const {
    errorCount,
    warningCount,
    noticeCount,
    adaScore,
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
  if (issues && pageInsights) {
    setImmediate(async () => {
      const insight = await queueLighthouseUntilResults({
        urlMap,
        apiKey: pageSpeedApiKey,
        host
      });

      await controller.addLighthouse({
        user_id: userId,
        insight,
        domain,
        url: urlMap,
      });
    });
  }

  // default to blank array
  const { issues: issueList = [], documentTitle = "" } = issues ?? {};

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
        totalIssues: issueList.length || 0,
        issuesFixedByCdn: possibleIssuesFixedByCdn || 0, // TODO: update confirmation
        errorCount,
        warningCount,
        noticeCount,
        adaScore,
        issueMeta,
      },
      lastScanDate: new Date().toISOString(),
    },
    issues: {
      domain,
      pageUrl,
      issues: issueList,
      documentTitle,
    },
    script: scriptData,
    userId,
  };
};
