import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import lighthouse from "lighthouse";
import { struct } from "pb-util";
import { chromeHost } from "../../../config/chrome";
import { CHROME_PORT } from "../../../config/config";
import { lighthouseEmitter } from "../../event/lh";
import { fetchUrl } from "../utils/fetch";

interface Task {
  // the url
  urlMap: string;
  // lighthouse api key
  apiKey?: string;
  // the hostname for the request
  host: string;
}

export const promisifyLighthouse = async ({ urlMap, host }: Task) => {
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

  lighthouseEmitter.emit(`lh-processing-${urlMap}`, data);

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
export const queueLighthouseUntilResults = ({ urlMap, apiKey, host }: Task) => {
  // queue and wait for results
  return new Promise(async (resolve) => {
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
        false
      ).catch((e) => {
        console.error(e);
      });

      // no errors exist process results.
      if (data && "lighthouseResult" in data && "error" in data === false) {
        return resolve(struct.encode(data.lighthouseResult));
      }
    }

    // event process the lighthouse result from queue
    lighthouseEmitter.once(`lh-processing-${urlMap}`, (data) => {
      if (data) {
        resolve(struct.encode(data));
      } else {
        resolve(data);
      }
    });

    // internal queue for single process lighthouse devtools
    await queueLighthouse.unshift({ urlMap, host }).catch((e) => {
      console.error(e);
      // exit the method
      resolve(null);
    });
  });
};
