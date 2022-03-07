/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

/* WORKER PROCESS - NO IMPORTS */
const fetcher = require("node-fetch");

process.on(
  "message",
  ({
    scriptBody: scriptBuffer,
    cdnSourceStripped,
    domain,
    screenshot,
    screenshotStill,
  }) => {
    const headers = { "Content-Type": "application/json" };

    const storeCDNValues = async () => {
      try {
        await fetcher(`${process.env.SCRIPTS_CDN_URL}/add-screenshot`, {
          method: "POST",
          body: JSON.stringify({
            cdnSourceStripped,
            domain,
            screenshot,
            screenshotStill,
          }),
          headers,
        });
      } catch (e) {
        console.log(e);
      }

      try {
        await fetcher(`${process.env.SCRIPTS_CDN_URL}/add-script`, {
          method: "POST",
          body: JSON.stringify({
            scriptBuffer,
            cdnSourceStripped,
            domain,
          }),
          headers,
        });
      } catch (e) {
        console.log(e);
      }

      process.send("close");
    };

    storeCDNValues();
  }
);
