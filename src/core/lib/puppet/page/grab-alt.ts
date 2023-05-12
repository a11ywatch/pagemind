import { networkBlock } from "kayle";
import { detectImageModel } from "../../../ai/detectImage";
import { createCanvasPupet } from "../create-canvas";
import { a11yConfig } from "../../../../config";
import type { Page } from "playwright-core";
import {
  needsLongTextAlt,
  missingAltText,
  imgAltMissing,
} from "../../../strings";
import { INVALID_HTML_PROPS } from "../../engine/models/issue-type";

interface Alt {
  alt: string;
  lang: string;
}

// determine if alt is missing in element
export const isAltMissing = (message: string) =>
  [
    imgAltMissing,
    INVALID_HTML_PROPS.ignored.img,
    needsLongTextAlt,
    missingAltText,
  ].includes(message);

interface Alt {
  alt: string;
  lang: string;
}

interface AltProps {
  element: any;
  page: Page;
  index: number;
  cv?: boolean; // can use computer vision
}

// reblock async images
const performNetworkBlock = async (req, reqq) =>
  await networkBlock(req, reqq, true);

// determine if an alt is missing in an image and reload the page.
export const getAltImage = async ({
  element,
  page,
  index,
  cv,
}: AltProps): Promise<Alt> => {
  let alt = "";

  const selector = element?.selector; // the selector to use for the page

  if (selector) {
    // reload the page and allow request to get images
    if (index === 0) {
      try {
        page.off("request" as any, networkBlock as any);
        page.route("**/*", performNetworkBlock);
        await page.reload({
          waitUntil: "networkidle",
          timeout: a11yConfig.timeout,
        });
      } catch (e) {
        console.error(e);
      }
    }

    let canvas;

    try {
      canvas = await page.evaluate(createCanvasPupet, element.selector);
    } catch (e) {
      console.error(e);
    }

    if (canvas) {
      const { imageToBase64, width, height, url } = canvas ?? {};
      const img = await detectImageModel(
        imageToBase64,
        {
          width,
          height,
        },
        url,
        cv
      );

      if (img && "className" in img && "probability" in img) {
        if (img.probability >= Number(0.5)) {
          alt = img.className; // TODO: allow user to determine score
        }
      }
    }
  }

  return {
    alt,
    lang: "en",
  };
};
