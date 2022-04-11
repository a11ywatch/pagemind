import fetch from "node-fetch";

const headers = { "Content-Type": "application/json" };

// TODO: gRPC
export const storeCDNValues = async ({
  scriptBody: scriptBuffer,
  cdnSourceStripped,
  domain,
  screenshot,
  screenshotStill,
}: any) => {
  try {
    await fetch(`${process.env.SCRIPTS_CDN_URL}/add-screenshot`, {
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
    console.log(e);
  }
};
