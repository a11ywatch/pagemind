import { getAltImage } from "./grab-alt";
import { a11yConfig } from "../../../../config";

const AI_DISABLED = process.env.AI_DISABLED === "true";

export const getPageMeta = async ({
  report,
  page,
  cv,
  client,
}): Promise<void> => {
  const pageIssues = (report && report?.issues) || [];
  const automateable = report && report?.automateable?.missingAltIndexs;

  if (automateable && automateable?.length && !AI_DISABLED) {
    try {
      await client.send("Fetch.disable");
      await page.reload({
        waitUntil: "domcontentloaded",
        timeout: a11yConfig.timeout,
      });
    } catch (e) {
      // console.error(e);
    }

    await Promise.allSettled(
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
