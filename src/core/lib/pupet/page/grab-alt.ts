/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { detectImageModel } from "../../../ai";
import { createCanvasPupet } from "../create-canvas";
import { needsLongTextAlt, missingAltText } from "../../../strings";
import { getFirstItemBySplit } from "../utils/extract-first";

interface Alt {
  alt: string;
  lang: string;
}

export const getAltImage = async ({ element, page }): Promise<Alt> => {
  let alt = "";

  if (
    [needsLongTextAlt, missingAltText].includes(element?.message) &&
    element?.selector
  ) {
    try {
      const { imageToBase64, width, height } = await page.evaluate(
        createCanvasPupet,
        element.selector
      );

      const img = await detectImageModel(imageToBase64, {
        width,
        height,
      });

      if (img) {
        alt = getFirstItemBySplit(img?.className);
      } else {
        console.info("could not get alt: invalid image.");
      }
    } catch (e) {
      console.error(e);
    }
  }

  return {
    alt,
    lang: "en",
  };
};
