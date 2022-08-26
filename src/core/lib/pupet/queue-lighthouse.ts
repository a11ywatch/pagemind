import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import lighthouse from "lighthouse";
import { struct } from "pb-util";
import { chromeHost } from "../../../config/chrome";
import { CHROME_PORT } from "../../../config/config";
import { lighthouseEmitter } from "../../event/lh";
import { fetchUrl } from "../utils/fetch";

interface Task {
  urlMap: string;
  apiKey?: string;
}

export const promisifyLighthouse = async ({ urlMap }: any) => {
  let data;

  try {
    const { lhr } = (await lighthouse(urlMap, {
      port: CHROME_PORT,
      hostname: chromeHost,
      output: "json",
      disableStorageReset: true,
      onlyCategories: ["accessibility", "best-practices", "performance", "seo"],
      saveAssets: false,
    })) ?? { lhr: null };
    if (lhr) {
      // convert to gRPC Struct
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
  1
);

export const queueLighthouseUntilResults = ({ urlMap, apiKey }: Task) => {
  // queue and wait for results
  return new Promise(async (resolve) => {
    const key = apiKey || process.env.PAGESPEED_API_KEY;
    const API_KEY = key ? `&key=${String(key).trim()}` : "";
    const categories =
      "&category=accessibility&category=best-practices&category=performance&category=seo";

    // if item in queue use rest api for pageinsights to speed up process. SWAP between queue and network.
    if (
      apiKey ||
      (!queueLighthouse.idle() && key) ||
      (!key && !queueLighthouse.idle() && queueLighthouse.length() === 1)
    ) {
      const data = await fetchUrl(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${urlMap}${categories}${API_KEY}`
      ).catch((e) => {
        console.error(e);
      });

      // no errors exist process results.
      if (data && "lighthouseResult" in data && "error" in data === false) {
        resolve(struct.encode(data.lighthouseResult));
        return;
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
    queueLighthouse.push({ urlMap }).catch((e) => {
      console.error(e);
      // exit the method
      resolve(null);
    });
  });
};
