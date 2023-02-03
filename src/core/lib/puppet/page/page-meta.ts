import { getAltImage } from "./grab-alt";

// disable AI for getting page alt images
const AI_DISABLED = process.env.AI_DISABLED === "true";

export const getPageMeta = ({ report, page, cv }): Promise<void> => {
  const pageIssues = (report && report?.issues) || [];
  const automateable = (report && report?.automateable?.missingAltIndexs) || [];

  return new Promise(async (resolve) => {
    if (!pageIssues?.length || AI_DISABLED) {
      resolve();
    }

    let index = 0;

    for (const eleIndex of automateable) {
      // exit if over 5000 missing alts exist
      if (index > 5000) {
        break;
      }

      // element from issues array
      const element = pageIssues[eleIndex];

      // element contains alt tag related error message and reload the page if issues exist.
      const extraConfig = await getAltImage({
        element,
        page,
        index,
        cv,
      }).catch((e) => {
        console.error(e);
      });

      const altFix = extraConfig && extraConfig?.alt;

      // if alt exist apply recommendation to element
      if (altFix) {
        element.message = `${element.message} Recommendation: change alt to ${altFix}.`;
      }

      index++;
    }

    resolve();
  });
};
