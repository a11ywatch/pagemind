const DEV = process.env.NODE_ENV === "development";
const CHROME_PORT = process.env.CHROME_PORT || 9222;

export { DEV, CHROME_PORT };
