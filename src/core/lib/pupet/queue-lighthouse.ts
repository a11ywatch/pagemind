import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import lighthouse from "lighthouse";
import { chromeHost } from "@app/config/chrome";
import { struct } from "pb-util";
import { lighthouseEmitter } from "@app/core/event/lh";
import { CHROME_PORT } from "@app/config/config";

interface Task {
  urlMap: string;
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
  try {
    return await promisifyLighthouse(arg);
  } catch (e) {
    console.error(e);
  }
}

export const queueLighthouse: queueAsPromised<Task> = fastq.promise(
  asyncWorker,
  1
);

export const queueLighthouseUntilResults = ({ urlMap }: Task) => {
  // queue and wait for results
  return new Promise(async (resolve) => {
    lighthouseEmitter.once(`lh-processing-${urlMap}`, (data) => {
      if (data) {
        resolve(struct.encode(data));
      } else {
        resolve(data);
      }
    });

    await queueLighthouse.push({ urlMap }).catch((e) => {
      console.error(e);
      // exit the method
      resolve(null);
    });
  });
};
