/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { ASSETS_CDN } from "@app/config/config";

const scriptDetect = ({
  domain,
  cdnSrc,
}: {
  domain?: string;
  cdnSrc?: string;
}) => {
  const correctScript = `${cdnSrc.replace("-ada-fix", "")}`;
  const domainSource = `${ASSETS_CDN}/cdn/${domain}/${correctScript}`;
  const pdetch = (
    correctScript.includes("-") ? correctScript.split("-").pop() : ""
  ).replace("-", "/");
  // TODO: REVIST DOMAIN EXTRACT LOGIC

  return `
	// SO: SMART CDN
	function detect(){
		if (window.location.pathname !== "/${pdetch}") {
			var ns = document.createElement("script");
			var cs = document.currentScript;
			var aw = window.location.pathname.replace("/", "").replace('/\?/g', "-");
			ns.src = "${domainSource}" + aw + "-ada-fix.min.js";
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
