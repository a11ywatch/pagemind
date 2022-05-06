import { ASSETS_CDN } from "@app/config";

interface ScriptSource {
  domain?: string;
  cdnSrc?: string;
}

export const cdnRouteReplaceHandler = ({ domain, cdnSrc }: ScriptSource) => {
  const findAdaIndex = cdnSrc.indexOf("-ada-fix-");
  const baseTarget = cdnSrc.substring(0, findAdaIndex);
  // start of cdn
  const cdnSourceBase = `${ASSETS_CDN}/scripts/${domain}/${baseTarget}`;
  // end of cdn target
  const cdnSourceEndTarget = cdnSrc.slice(findAdaIndex);
  // transform to local path of url
  const baseUrl = new URL(`http://${domain}/${baseTarget}`);
  const hostNameToPath = baseUrl.host.replace(/[.]/g, "-");
  const currentPath = baseUrl.pathname.replace(`${hostNameToPath}-`, "");

  // determine if path is root
  const rootPath = currentPath === `/${domain.replace(/[.]/g, "-")}`;

  return {
    currentPath: rootPath ? "/" : currentPath,
    cdnSourceBase,
    cdnSourceEndTarget,
  };
};

// TEMP DISABLED FOR INFINITE REDIRCTS
const scriptDetect = (scriptProps: ScriptSource) => {
  const { currentPath, cdnSourceBase, cdnSourceEndTarget } =
    cdnRouteReplaceHandler(scriptProps);

  return `
	// SO: SMART CDN
	function detect(){
		if (window.location.pathname !== "${currentPath}") {
			var ns = document.createElement("script");
			var cs = document.currentScript;
			var aw = window.location.pathname.replace("/", "").replace('/\?/g', "-");
      var ppath = aw !== "/" ? "-" : "";

			ns.src = "${cdnSourceBase}" + ppath + aw + "${cdnSourceEndTarget}.min.js";
			document.body.appendChild(ns);
			if(cs) {
				cs.remove();			
			}
			return false;
		}  
	};
	detect();
	window.addEventListener('popstate', detect);
	// EO: SMART CDN
	`;
};

export { scriptDetect };
