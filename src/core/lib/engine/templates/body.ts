export const scriptBody = (
  { scriptChildren = "" }: { scriptChildren: string },
  head?: string
) => {
  if (head) {
    return `
${head}
${scriptChildren}`;
  }
  return scriptChildren;
};
