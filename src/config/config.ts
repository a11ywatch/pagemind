import { replaceDockerNetwork } from "@a11ywatch/website-source-builder";

const DEV = process.env.NODE_ENV === "development";

const CDN_URL = replaceDockerNetwork(
  String(process.env.SCRIPTS_CDN_URL),
  ["cdn-server"],
  true
);
const SCRIPTS_CDN_URL_HOST = process.env.SCRIPTS_CDN_URL_HOST;
const SCRIPTS_CDN_URL = replaceDockerNetwork(process.env.SCRIPTS_CDN_URL);
const ASSETS_CDN = process.env.ASSETS_CDN || "http://localhost:8090";

const CHROME_PORT = process.env.CHROME_PORT || 9222;

export {
  DEV,
  ASSETS_CDN,
  CDN_URL,
  CHROME_PORT,
  SCRIPTS_CDN_URL,
  SCRIPTS_CDN_URL_HOST,
};
