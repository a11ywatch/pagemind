import { URL } from "url";

// get the default load balancer host name and tpt
export const getLoadBalancerDefaults = (lbname: string) => {
  let lbHost = "";
  let defaultTPTHttp = true; // determine if http via boolean
  let tpt = "http";

  if (lbname) {
    if (lbname.startsWith("https")) {
      defaultTPTHttp = false;
      tpt = "https";
    }

    try {
      const hs = new URL(
        lbname.startsWith("http") ? lbname : `${tpt}://${lbname}`
      );

      if (hs) {
        lbHost = hs.hostname;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return { host: lbHost, tpt, defaultTPTHttp };
};
