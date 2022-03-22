/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { ASSETS_CDN } from "@app/config";

const scriptDetect = ({
  domain,
  cdnSrc,
}: {
  domain?: string;
  cdnSrc?: string;
}) => {
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

  return `
	// SO: SMART CDN
	// function detect(){
	// 	if (window.location.pathname !== "${currentPath}") {
	// 		var ns = document.createElement("script");
	// 		var cs = document.currentScript;
	// 		var aw = window.location.pathname.replace("/", "").replace('/\?/g', "-");
	// 		ns.src = "${cdnSourceBase}" + aw + "${cdnSourceEndTarget}.min.js";
	// 		document.body.appendChild(ns);
	// 		if(cs) {
	// 			cs.remove();			
	// 		}
	// 		return false;
	// 	}  
	// };
	// detect();
	// window.addEventListener('popstate', detect);
	// EO: SMART CDN
	`;
};

export { scriptDetect };
