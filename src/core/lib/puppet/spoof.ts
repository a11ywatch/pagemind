import { getRandomDesktopUA, getRandomMobileUA } from "./agent";

// desktop viewport
export const desktopViewport = {
  width: 800,
  height: 600,
  deviceScaleFactor: 1,
  isMobile: false,
};

// mobile viewpoer
export const mobileViewport = {
  width: 320,
  height: 480,
  deviceScaleFactor: 2,
  isMobile: true,
};

// spoof a real page ua and viewport
export const spoofPage = (mobile: boolean, uua: string = "") => {
  let agent = uua;
  let vp = desktopViewport;

  if (mobile) {
    if (uua) {
      vp = mobileViewport;
    } else {
      const ua = getRandomDesktopUA();
      agent = ua.data.userAgent;
      vp = {
        height: ua.data.viewportHeight || mobileViewport.height,
        width: ua.data.viewportWidth || mobileViewport.width,
        deviceScaleFactor: mobileViewport.deviceScaleFactor,
        isMobile: true,
      };
    }
  } else if (!uua) {
    const ua = getRandomMobileUA();
    agent = ua.data?.userAgent;
    vp = {
      height: ua.data.viewportHeight || desktopViewport.height,
      width: ua.data.viewportWidth || desktopViewport.width,
      deviceScaleFactor: desktopViewport.deviceScaleFactor,
      isMobile: false,
    };
  }

  return {
    vp,
    agent: agent ?? "a11ywatch/v1",
  };
};
