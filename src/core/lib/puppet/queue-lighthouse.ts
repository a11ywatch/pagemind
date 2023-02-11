import lighthouse from "lighthouse";
import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { struct } from "pb-util";
import { chromeHost } from "../../../config/chrome";
import { CHROME_PORT } from "../../../config/config";
import { fetchUrl } from "../utils/fetch";
import { controller } from "../../../proto/website-client";

interface Task {
  // the url
  urlMap: string;
  // lighthouse api key
  apiKey?: string;
  // the hostname for the request
  host: string;
  userId: number;
  domain: string;
}

export const promisifyLighthouse = async ({
  urlMap,
  host,
  domain,
  userId,
}: Task) => {
  let data;

  try {
    const { lhr } = (await lighthouse(urlMap, {
      port: CHROME_PORT,
      hostname: host ?? chromeHost,
      output: "json",
      disableStorageReset: true,
      onlyCategories: ["accessibility", "best-practices", "performance", "seo"],
      saveAssets: false,
    })) ?? { lhr: null };

    if (lhr) {
      data = lhr;
    }
  } catch (_) {}

  try {
    await controller.addLighthouse({
      user_id: userId,
      insight: struct.encode(data),
      domain,
      url: urlMap,
    });
  } catch (e) {
    console.error(e);
  }

  return data;
};

// the async worker to use for completed crawl actions.
async function asyncWorker(arg: Task): Promise<any> {
  return await promisifyLighthouse(arg);
}

export const queueLighthouse: queueAsPromised<Task> = fastq.promise(
  asyncWorker,
  1 // only one allowed per instance
);

const categories =
  "&category=accessibility&category=best-practices&category=performance&category=seo";

// slow queue lighthouse one by one on devtool instance
export const queueLighthouseUntilResults = async ({
  urlMap,
  apiKey,
  host,
  userId,
  domain,
}: Task) => {
  // queue and wait for results
  const key = apiKey || process.env.PAGESPEED_API_KEY;
  const API_KEY = key ? `&key=${String(key).trim()}` : "";

  // if item in queue use rest API for pageinsights to speed up process. SWAP between queue and network.
  if (
    apiKey ||
    (!queueLighthouse.idle() && key) ||
    (!key && !queueLighthouse.idle() && queueLighthouse.length() === 1)
  ) {
    const data = await fetchUrl(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${urlMap}${categories}${API_KEY}`,
      false,
      true // add ua keep alive
    ).catch((e) => {
      console.error(e);
    });

    // no errors exist process results.
    if (data && "lighthouseResult" in data && "error" in data === false) {
      try {
        await controller.addLighthouse({
          user_id: userId,
          insight: struct.encode(data.lighthouseResult),
          domain,
          url: urlMap,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  // internal queue for single process lighthouse devtools
  await queueLighthouse.unshift({ urlMap, host, userId, domain }).catch((e) => {
    console.error(e);
  });
};
