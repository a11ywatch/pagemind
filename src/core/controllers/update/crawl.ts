import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import lighthouse from "lighthouse";
import { DEV, ASSETS_CDN } from "@app/config/config";
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
};

const cdn_base = ASSETS_CDN + "/screenshots/";

const cleanPool = async (browser?: Browser, page?: Page) =>
  browser?.isConnected() && (await puppetPool.clean(page, browser));

export const crawlWebsite = async ({
  userId,
  url: uri,
  pageHeaders,
  pageInsights,
}) => {
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

  let duration = Date.now();

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

    const [screenshot, screenshotStill] = await Promise.all([
      page.screenshot({ fullPage: true }),
      process.env.BACKUP_IMAGES
        ? page.screenshot({ fullPage: false })
        : Promise.resolve(undefined),
    ]);

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
        insight = lhr;
      } catch (e) {
        console.error(e);
      }
    }

    const scriptBody = scriptBuild(scriptProps, true);

    // TODO: move to gRPC FROM API SERVER NOT PAGEMIND -> CDN
    setImmediate(async () => {
      try {
        await storeCDNValues({
          cdnSourceStripped,
          domain,
          screenshot,
          screenshotStill,
          scriptBody,
        });
      } catch (e) {
        console.error(e);
      }
    });

    resolver = {
      webPage: {
        domain,
        url: pageUrl,
        adaScore,
        cdnConnected: pageHasCdn,
        screenshot: `${cdn_base}${cdnJsPath.replace(".js", ".png")}`,
        screenshotStill: screenshotStill
          ? `${cdn_base}${cdnJsPath.replace(".js", "-still.png")}`
          : "",
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
        userId,
      },
      issues: Object.assign({}, issues, {
        domain,
        pageUrl,
        userId,
      }),
      script: {
        pageUrl,
        domain,
        script: scriptBody,
        cdnUrlMinified: cdnMinJsPath,
        cdnUrl: cdnJsPath,
        cdnConnected: pageHasCdn,
        userId,
        issueMeta,
      },
    };
  } catch (e) {
    console.error(e);
  }

  await cleanPool(browser, page);

  return resolver;
};
