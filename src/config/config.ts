const DEV = process.env.NODE_ENV === "development";
const ASSETS_CDN = process.env.ASSETS_CDN || "http://localhost:8090"; // cdn storage
const CHROME_PORT = process.env.CHROME_PORT || 9222;

export { DEV, ASSETS_CDN, CHROME_PORT };
