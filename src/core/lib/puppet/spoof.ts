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
      vp = {
        height: mobileViewport.height,
        width: mobileViewport.width,
        deviceScaleFactor: mobileViewport.deviceScaleFactor,
        isMobile: true,
      };
    }
  } else if (!uua) {
    vp = {
      height: desktopViewport.height,
      width: desktopViewport.width,
      deviceScaleFactor: desktopViewport.deviceScaleFactor,
      isMobile: false,
    };
  }

  return {
    vp,
    agent: agent ?? "a11ywatch/v1",
  };
};
