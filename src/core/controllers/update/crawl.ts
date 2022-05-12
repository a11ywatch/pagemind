import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import lighthouse from "lighthouse";
import { DEV } from "@app/config/config";
import {
  puppetPool,
  checkCdn,
  scriptBuild,
  getPageIssues,
  goToPage,
  getPageMeta,
} from "@app/core/lib";
import { chromeHost } from "@app/config/chrome";
import { storeCDNValues } from "./cdn_worker";
import type { Browser, Page } from "puppeteer";
import type { IssueData } from "@app/types";

const EMPTY_RESPONSE = {
  webPage: null,
  issues: null,
  script: null,
  userId: null,
};

const cleanPool = async (browser?: Browser, page?: Page) =>
  browser?.isConnected() && (await puppetPool.clean(page, browser));

export const crawlWebsite = async ({
  userId,
  url: uri,
  pageHeaders,
  pageInsights,
  noStore, // do not store any data
  scriptsEnabled,
  mobile,
  actions,
}) => {
  let page: Page;
  let browser: Browser;

  try {
    browser = await puppetPool.acquire();
  } catch (e) {
    console.error(e);
  }

  try {
    page = await browser?.newPage();
  } catch (e) {
    console.error(e);
  }

  const urlMap = decodeURIComponent(uri);

  let duration = Date.now(); // page ttl
  try {
    await goToPage(page, urlMap);
  } catch (e) {
    console.error(e);
  }
  duration = Math.floor(Date.now() - duration); // set the duration to time it takes to load page for ttyl

  const { domain, pageUrl, cdnSourceStripped, cdnJsPath, cdnMinJsPath } =
    sourceBuild(urlMap, userId);

  let resolver = Object.assign({}, EMPTY_RESPONSE);
  let pageIssues = [];

  try {
    pageIssues = await getPageIssues({
      urlPage: pageUrl,
      page,
      browser,
      pageHeaders,
      mobile,
      actions,
    });
  } catch (e) {
    console.error(e);
  }

  const [issues, issueMeta] = pageIssues;
  let pageHasCdn;
  let pageMeta;

  try {
    pageHasCdn = await checkCdn({ page, cdnMinJsPath, cdnJsPath });
  } catch (e) {
    console.error(e);
  }

  try {
    pageMeta = await getPageMeta({ page, issues, scriptsEnabled });
  } catch (e) {
    console.error(e);
  }

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

  if (!noStore) {
    // TODO: move to stream
    try {
      await storeCDNValues({
        cdnSourceStripped,
        domain,
        scriptBody,
      });
    } catch (e) {
      console.error(e);
    }
  }

  let insight;

  // light house pageinsights
  if (pageInsights) {
    try {
      const { lhr } = await lighthouse(urlMap, {
        port: new URL(browser.wsEndpoint()).port,
        hostname: chromeHost,
        output: "json",
        logLevel: DEV ? "info" : undefined,
        disableStorageReset: true,
      });
      // TODO: map to protobufs
      insight = JSON.stringify(lhr);
    } catch (e) {
      console.error(e);
    }
  }

  resolver = {
    webPage: {
      domain,
      url: pageUrl,
      adaScore,
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
        issuesFixedByCdn: possibleIssuesFixedByCdn || 0,
        errorCount,
        warningCount,
        noticeCount,
        adaScore,
        issueMeta,
      } as IssueData,
      lastScanDate: new Date().toUTCString(),
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

  try {
    await cleanPool(browser, page);
  } catch (e) {
    console.error(e);
  }

  return resolver;
};
