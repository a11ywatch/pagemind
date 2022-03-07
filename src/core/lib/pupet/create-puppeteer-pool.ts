/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import genericPool from "generic-pool";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { DEV } from "../../../config";

puppeteer.use(StealthPlugin()).use(AdblockerPlugin({ blockTrackers: true }));

const puppeteerArgs = [
  "--no-sandbox",
  "--disable-gpu",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  '--proxy-server="direct://"',
  "--proxy-bypass-list=*",
];

// TODO: m1 chip use add env for PUPPET_SINGLE_PROCESS via cli;
if (
  process.env.PUPPET_SINGLE_PROCESS &&
  process.env.PUPPET_SINGLE_PROCESS === "true"
) {
  puppeteerArgs.push("--single-process");
}

const puppeteerConfig = {
  executablePath: process.env.CHROME_BIN || null,
  ignoreHTTPSErrors: true,
  args: puppeteerArgs,
  headless: true,
  dumpio: DEV,
  timeout: 15000,
};

const POOL_DEFAULTS = {
  min: 0,
  max: process.env.PUPPET_POOL_MAX || 4,
  testOnBorrow: true,
  puppeteerArgs: [puppeteerConfig],
  validate: () => Promise.resolve(true),
};

const createPuppeteerFactory = ({ puppeteerArgs, validate }) => ({
  async create() {
    try {
      return await puppeteer.launch(...puppeteerArgs);
    } catch (e) {
      console.log(e, { type: "error" });
    }
  },
  async destroy(browser) {
    try {
      await browser?.close();
    } catch (e) {
      console.log(e, { type: "error" });
    }
  },
  validate,
});

export async function launchPuppeter() {
  try {
    return await puppeteer.launch(puppeteerConfig);
  } catch (e) {
    console.log(e, { type: "error" });
    return null;
  }
}

export function createPuppeteerPool(poolConfig?) {
  const config = Object.assign({}, POOL_DEFAULTS, poolConfig);
  const factory = createPuppeteerFactory(config);
  const { validate, puppeteerArgs, ...extractedPoolConfig } = config;

  return genericPool.createPool(factory, extractedPoolConfig);
}
