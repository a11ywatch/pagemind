/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import fetch from "node-fetch";

const headers = { "Content-Type": "application/json" };

process.on(
  "message",
  async ({
    scriptBody: scriptBuffer,
    cdnSourceStripped,
    domain,
    screenshot,
    screenshotStill,
  }) => {
    console.log("boom");
    try {
      await fetch(`${process.env.SCRIPTS_CDN_URL}/add-screenshot`, {
        method: "POST",
        body: JSON.stringify({
          cdnSourceStripped,
          domain,
          screenshot,
          screenshotStill,
        }),
        headers: { "Content-Type": "application/json" },
      });

      await fetch(`${process.env.SCRIPTS_CDN_URL}/add-script`, {
        method: "POST",
        body: JSON.stringify({
          scriptBuffer,
          cdnSourceStripped,
          domain,
        }),
        headers,
      });
    } catch (e) {
      console.error(e);
    } finally {
      process.send("close");
    }
  }
);
