import validUrl from "valid-url";
import getPageSpeed from "get-page-speed";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { format } from "prettier";
import lighthouse from "lighthouse";
import { DEV, ASSETS_CDN } from "../../../config";
import {
  puppetPool,
  checkCdn,
  grabHtmlSource,
  scriptBuild,
  getPageIssues,
  goToPage,
  getPageMeta,
} from "../../lib";
import type { Browser, Page } from "puppeteer";
import type { IssueData } from "../../../types";
import { storeCDNValues } from "./cdn_worker";
import { chromeHost } from "@app/config/chrome";

const EMPTY_RESPONSE = {
  webPage: null,
  issues: null,
  script: null,
};

const cdn_base = ASSETS_CDN + "/screenshots/";

const cleanPool = async (browser: Browser, page: Page) =>
  browser.isConnected() && (await puppetPool.clean(page, browser));

export const crawlWebsite = async ({
  userId,
  url: urlMap,
  pageHeaders,
  pageInsights,
}) => {
  if (!validUrl.isUri(urlMap)) {
    return EMPTY_RESPONSE;
  }

  let browser: Browser;

  try {
    browser = await puppetPool.acquire();
  } catch (e) {
    console.log(e);
  }

  let page: Page;

  try {
    page = await browser?.newPage();
  } catch (e) {
    console.log(e);
  }

  if (!page) {
    await cleanPool(browser, page);
    return EMPTY_RESPONSE;
  }

  const { domain, pageUrl, cdnSourceStripped, cdnJsPath, cdnMinJsPath } =
    sourceBuild(urlMap, userId);

  let resolver = Object.assign({}, EMPTY_RESPONSE);

  try {
    const [validPage] = await goToPage(page, urlMap);

    if (!validPage) {
      await cleanPool(browser, page);
      return EMPTY_RESPONSE;
    }

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

    const [html, duration] = await grabHtmlSource({
      page,
    });

    const {
      errorCount,
      warningCount,
      noticeCount,
      adaScore,
      scriptChildren,
      possibleIssuesFixedByCdn,
    } = await getPageMeta({ page, issues, html });

    const scriptProps = {
      scriptChildren,
      domain,
      cdnSrc: cdnSourceStripped,
    };

    let insight;

    if (pageInsights) {
      try {
        // TODO: MOVE TO SEPERATE PROCESS WITH MESSAGE
        const { lhr } = await lighthouse(urlMap, {
          port: new URL(browser.wsEndpoint()).port,
          hostname: chromeHost,
          output: "json",
          logLevel: DEV ? "info" : undefined,
        });
        insight = lhr;
      } catch (e) {
        console.error(e);
      }
    }

    setImmediate(async () => {
      try {
        await storeCDNValues({
          cdnSourceStripped,
          domain,
          screenshot,
          screenshotStill,
          scriptBody: scriptBuild(scriptProps, true),
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
        html,
        insight,
        htmlIncluded: !!html,
        issuesInfo: {
          possibleIssuesFixedByCdn: possibleIssuesFixedByCdn,
          totalIssues: issues?.issues?.length || 0,
          issuesFixedByCdn: pageHasCdn ? possibleIssuesFixedByCdn : 0,
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
        script: format(scriptBuild(scriptProps, false), {
          semi: true,
          parser: "html",
        }),
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
