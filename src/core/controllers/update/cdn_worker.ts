import fetcher from "node-fetch";

const headers = { "Content-Type": "application/json" };

// TODO: MOVE THIS EVENT TO API-SERVER
export const storeCDNValues = async ({
  scriptBody: scriptBuffer,
  cdnSourceStripped,
  domain,
  screenshot,
  screenshotStill,
}: any) => {
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
};
