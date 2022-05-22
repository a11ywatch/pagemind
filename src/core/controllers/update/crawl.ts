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
import { struct } from "pb-util";

const EMPTY_RESPONSE = {
  webPage: null,
  issues: null,
  script: null,
  userId: null,
};

const cleanPool = async (browser?: Browser, page?: Page) =>
  await puppetPool.clean(page, browser);

export const promisifyLighthouse = ({ browser, urlMap }: any) => {
  return new Promise(async (resolve) => {
    try {
      const { lhr } = await lighthouse(urlMap, {
        port: new URL(browser.wsEndpoint()).port,
        hostname: chromeHost,
        output: "json",
        logLevel: DEV ? "info" : undefined,
        disableStorageReset: true,
        onlyCategories: [
          "accessibility",
          "best-practices",
          "performance",
          "seo",
        ],
      });
      if (lhr) {
        // convert to gRPC Struct
        resolve(struct.encode(lhr));
      } else {
        resolve(null);
      }
    } catch (e) {
      console.error(e);
    }
  });
};

export const crawlWebsite = async ({
  userId,
  url: uri,
  pageHeaders,
  pageInsights,
  noStore, // do not store any data
  scriptsEnabled,
  mobile,
  actions,
  standard,
  ua,
}) => {
  let page: Page;
  let browser: Browser;
  const urlMap = decodeURIComponent(uri);

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

  try {
    await page?.setBypassCSP(true);
  } catch (e) {
    console.error(e);
  }

  let hasPage = true;
  let duration = Date.now(); // page ttl
  try {
    hasPage = await goToPage(page, urlMap);
  } catch (e) {
    console.error(e);
  }
  duration = Math.floor(Date.now() - duration); // set the duration to time it takes to load page for ttyl

  // if page did not succeed exit.
  if (!hasPage) {
    try {
      await cleanPool(browser, page);
    } catch (e) {
      console.error(e);
    }

    return {
      ...EMPTY_RESPONSE,
      userId,
    };
  }

  const { domain, pageUrl, cdnSourceStripped, cdnJsPath, cdnMinJsPath } =
    sourceBuild(urlMap, userId);

  let resolver = Object.assign({}, EMPTY_RESPONSE);
  let pageIssues = [];
  let insight;

  try {
    pageIssues = await getPageIssues({
      urlPage: pageUrl,
      page,
      browser,
      pageHeaders,
      mobile,
      actions,
      standard,
      ua,
    });
  } catch (e) {
    console.error(e);
  }

  const [issues, issueMeta] = pageIssues ?? [];

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

  // light house pageinsights
  if (pageInsights) {
    try {
      insight = await promisifyLighthouse({ urlMap, browser });
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
