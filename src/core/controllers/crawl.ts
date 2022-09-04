import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import type { Browser, Page } from "puppeteer";
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

const EMPTY_RESPONSE = {
  webPage: null,
  issues: null,
  script: null,
  userId: null,
};

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
  let page: Page = null;

  try {
    page = await browser.newPage();
  } catch (e) {
    console.error(e);
    await cleanPool(browser, page);

    return {
      ...EMPTY_RESPONSE,
      userId,
    };
  }

  let duration = Date.now(); // page ttl
  const hasPage = await goToPage(page, urlMap); // does the page exist
  duration = Math.floor(Date.now() - duration); // set the duration to time it takes to load page for ttyl

  // if page did not succeed exit.
  if (!hasPage) {
    await cleanPool(browser, page);

    return {
      ...EMPTY_RESPONSE,
      userId,
    };
  }

  let insight = null; // page insights

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

  const [issues, issueMeta] = pageIssues ?? [];

  const pageHasCdn = await checkCdn({ page, cdnMinJsPath, cdnJsPath });
  const pageMeta = await getPageMeta({ page, issues, scriptsEnabled, cv });

  const {
    errorCount,
    warningCount,
    noticeCount,
    adaScore,
    scriptChildren,
    possibleIssuesFixedByCdn,
  } = pageMeta ?? {};

  let scriptProps = {};
  let scriptBody;

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

  await cleanPool(browser, page);

  // light house pageinsights TODO: use stream to prevent blocking
  if (pageInsights) {
    insight = await queueLighthouseUntilResults({
      urlMap,
      apiKey: pageSpeedApiKey,
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
        color:
          duration <= 1500
            ? "#A5D6A7"
            : duration <= 3000
            ? "#E6EE9C"
            : "#EF9A9A",
      },
      insight,
      issuesInfo: {
        possibleIssuesFixedByCdn: possibleIssuesFixedByCdn,
        totalIssues: issues?.issues?.length || 0,
        issuesFixedByCdn: possibleIssuesFixedByCdn || 0, // TODO: update confirmation
        errorCount,
        warningCount,
        noticeCount,
        adaScore,
        issueMeta,
      },
      lastScanDate: new Date().toUTCString(), // TODO: send iso
    },
    issues: Object.assign({}, issues, {
      domain,
      pageUrl,
    }),
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
