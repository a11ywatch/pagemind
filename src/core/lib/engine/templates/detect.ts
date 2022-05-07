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
