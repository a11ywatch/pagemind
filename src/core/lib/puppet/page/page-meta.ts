import { networkBlock } from "kayle";
import { getAltImage, performNetworkBlock } from "./grab-alt";
import { a11yConfig } from "../../../../config";

const AI_DISABLED = process.env.AI_DISABLED === "true";

export const getPageMeta = async ({ report, page, cv }): Promise<void> => {
  const pageIssues = (report && report?.issues) || [];
  const automateable = (report && report?.automateable?.missingAltIndexs) || [];

  if (pageIssues?.length && !AI_DISABLED) {
    try {
      await page.unroute("**/*", networkBlock);
      await page.route("**/*", performNetworkBlock);
      await page.reload({
        waitUntil: "domcontentloaded",
        timeout: a11yConfig.timeout,
      });
    } catch (e) {
      // console.error(e);
    }

    await Promise.all(
      automateable.map(async (eleIndex) => {
        const element = pageIssues[eleIndex];

        const { alt } = await getAltImage({
          element,
          page,
          cv,
        });

        if (alt) {
          element.message = `${element.message} Recommendation: change alt to ${alt}.`;
        }
      })
    );
  }
};
