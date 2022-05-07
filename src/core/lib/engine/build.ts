import { scriptBody } from "./templates";

const buildConfig = {
  scriptEntry: `<script defer>`,
  scriptExit: `</script>`,
  funcHead: `
  void function init() {`,
  funcTail: `}();`,
};

interface ScriptBuildProps {
  scriptChildren?: string;
  domain?: string;
  cdnSrc?: string;
}

export const scriptBuild = (
  { scriptChildren }: ScriptBuildProps,
  cdn: boolean
) => {
  return `${!cdn ? buildConfig.scriptEntry : ""}
${buildConfig.funcHead}
${scriptBody({ scriptChildren }, "")}
${buildConfig.funcTail}
${!cdn ? buildConfig.scriptExit : ""}
`;
};
