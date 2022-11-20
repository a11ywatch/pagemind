import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import type { Browser, Page } from "puppeteer";
import { performance } from "perf_hooks";
import {
  puppetPool,
  checkCdn,
  scriptBuild,
  getPageIssues,
  goToPage,
  getPageMeta,
  queueLighthouseUntilResults,
} from "../lib";
import { storeCDNValues } from "./update/cdn_worker";
import { controller } from "../../proto/website-client";

// default empty response
const EMPTY_RESPONSE = {
  webPage: null,
  issues: null,
  script: null,
  userId: null,
};

// disc the browser socket req
const cleanPool = async (browser?: Browser, page?: Page) =>
  await puppetPool.clean(page, browser);

export const crawlWebsite = async ({
  userId,
  url: urlMap,
  pageHeaders,
  pageInsights,
  noStore, // do not store any data
  scriptsEnabled,
  mobile,
  actions,
  standard,
  ua,
  cv,
  pageSpeedApiKey,
}) => {
  const browser: Browser = await puppetPool.acquire();
  const page: Page = await browser.newPage();

  let duration = performance.now(); // page ttl
  const hasPage = await goToPage(page, urlMap); // does the page exist
  duration = performance.now() - duration; // set the duration to time it takes to load page for ttyl

  // if page did not succeed exit.
  if (!hasPage) {
    await cleanPool(browser, page);

    return {
      ...EMPTY_RESPONSE,
      userId,
    };
  }

  const { domain, pageUrl, cdnSourceStripped, cdnJsPath, cdnMinJsPath } =
    sourceBuild(urlMap, userId);

  const pageIssues = await getPageIssues({
    urlPage: pageUrl,
    page,
    browser,
    pageHeaders,
    mobile,
    actions,
    standard,
    ua,
  });

  const [issues, issueMeta] = pageIssues;

  // cdn for active acts
  const [pageHasCdn, pageMeta] = await Promise.all([
    !noStore
      ? checkCdn({ page, cdnMinJsPath, cdnJsPath })
      : Promise.resolve(false),
    getPageMeta({ page, issues, scriptsEnabled, cv }),
  ]);

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

  // get script from accessibility engine
  if (scriptsEnabled) {
    scriptProps = {
      scriptChildren,
      domain,
      cdnSrc: cdnSourceStripped,
    };
    scriptBody = scriptBuild(scriptProps, true);
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
  if (pageInsights) {
    setImmediate(async () => {
      const insight = await queueLighthouseUntilResults({
        urlMap,
        apiKey: pageSpeedApiKey,
      });

      await controller.addLighthouse({
        user_id: userId,
        insight,
        domain,
        url: urlMap,
      });
    });
  }

  const issueList = issues.issues;

  return {
    webPage: {
      domain,
      url: pageUrl,
      cdnConnected: pageHasCdn,
      pageLoadTime: {
        duration,
        durationFormated: getPageSpeed(duration),
        color:
          duration <= 1500
            ? "#A5D6A7"
            : duration <= 3000
            ? "#E6EE9C"
            : "#EF9A9A",
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
      documentTitle: issues.documentTitle,
    },
    script: scriptsEnabled
      ? {
          pageUrl,
          domain,
          script: scriptBody,
          cdnUrlMinified: cdnMinJsPath,
          cdnUrl: cdnJsPath,
          cdnConnected: pageHasCdn,
          issueMeta,
        }
      : null,
    userId,
  };
};
