import type { Page } from "puppeteer";
import { detectImageModel } from "../../../ai";
import { createCanvasPupet } from "../create-canvas";
import {
  needsLongTextAlt,
  missingAltText,
  imgAltMissing,
} from "../../../strings";
import { INVALID_HTML_PROPS } from "../../engine/models/issue-type";
import { networkBlock } from "./go-to-page";

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

interface AltProps {
  element: any;
  page: Page;
  index: number;
  cv?: boolean; // can use computer vision
}

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
        page.off("request", networkBlock);
        page.removeAllListeners("request");

        // allow images to run
        page.on("request", (req) => networkBlock(req, true));
        await page.reload();
      } catch (e) {
        console.error(e);
      }
    }

    let canvas;
    try {
      canvas = (await page.evaluate(
        createCanvasPupet,
        element.selector
      )) as any;
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
