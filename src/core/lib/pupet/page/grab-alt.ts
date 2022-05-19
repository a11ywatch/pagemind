import { detectImageModel } from "../../../ai";
import { createCanvasPupet } from "../create-canvas";
import {
  needsLongTextAlt,
  missingAltText,
  imgAltMissing,
} from "../../../strings";
import { getFirstItemBySplit } from "../utils/extract-first";
import { INVALID_HTML_PROPS } from "../../engine/models/issue-type";
import { Page } from "puppeteer";
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
}

// determine if an alt is missing in an image and reload the page.
export const getAltImage = async ({
  element,
  page,
  index,
}: AltProps): Promise<Alt> => {
  let imageToBase64;
  let width;
  let height;
  let alt = "";

  const selector = element?.selector; // the selector to use for the page

  if (selector) {
    // reload the page and allow request to get images
    if (index === 0) {
      try {
        page.off("request", networkBlock);
        page.removeAllListeners("request");
        await page.setRequestInterception(false);
        await page.reload();
      } catch (e) {
        console.error(e);
      }
    }
    try {
      const image = (await page.evaluate(
        createCanvasPupet,
        element.selector
      )) as any;

      if (image) {
        imageToBase64 = image?.imageToBase64;
        width = image?.width;
        height = image?.height;
      }
    } catch (e) {
      console.error(e);
    }
  }

  let img;

  if (imageToBase64) {
    try {
      img = await detectImageModel(imageToBase64, {
        width,
        height,
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (img) {
    if ("className" in img && "probability" in img) {
      // TODO: allow user to determine score
      if (img.probability >= Number(0.75)) {
        alt = getFirstItemBySplit(img.className);
      }
    }
  }

  return {
    alt,
    lang: "en",
  };
};
