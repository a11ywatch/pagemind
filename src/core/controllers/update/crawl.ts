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
  userId: uid,
  url: uri,
  pageHeaders,
  pageInsights,
}) => {
  const userId = typeof uid !== "undefined" ? Number(uid) : undefined;
  const urlMap = decodeURIComponent(uri);
  const browser: Browser = await puppetPool.acquire();
  let page: Page;

  try {
    page = await browser?.newPage();
  } catch (e) {
    console.error(e);
  }

  if (!page) {
    await cleanPool(browser, page);
    return EMPTY_RESPONSE;
  }

  let duration = Date.now(); // page ttl
  if (!(await goToPage(page, urlMap))) {
    await cleanPool(browser, page);
    return EMPTY_RESPONSE;
  }
  duration = Math.floor(Date.now() - duration); // set the duration to time it takes to load page for ttyl

  const { domain, pageUrl, cdnSourceStripped, cdnJsPath, cdnMinJsPath } =
    sourceBuild(urlMap, userId);

  let resolver = Object.assign({}, EMPTY_RESPONSE);

  try {
    const [issues, issueMeta] = await getPageIssues({
      urlPage: pageUrl,
      page,
      browser,
      pageHeaders,
    });

    const pageHasCdn = await checkCdn({ page, cdnMinJsPath, cdnJsPath });

    const {
      errorCount,
      warningCount,
      noticeCount,
      adaScore,
      scriptChildren,
      possibleIssuesFixedByCdn,
    } = await getPageMeta({ page, issues });

    const scriptProps = {
      scriptChildren,
      domain,
      cdnSrc: cdnSourceStripped,
    };

    let insight;

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

    const scriptBody = scriptBuild(scriptProps, true);

    // ATM userID 0 set to bot to ignore stores (refactor rpc call)
    if (userId) {
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
      script: {
        pageUrl,
        domain,
        script: scriptBody,
        cdnUrlMinified: cdnMinJsPath,
        cdnUrl: cdnJsPath,
        cdnConnected: pageHasCdn,
        issueMeta,
      },
      userId,
    };
  } catch (e) {
    console.error(e);
  }

  await cleanPool(browser, page);

  return resolver;
};
