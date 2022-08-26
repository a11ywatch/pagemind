import { adjustScript, editScript } from "./update";

// edits or add a script source then sends to AWS
export const mutateScript = async (body) => {
  const { editScript: edit, url, userId, script, newScript } = body ?? {};

  const props = Object.assign(
    {},
    {
      url: decodeURIComponent(url + ""),
      userId,
      script,
      newScript,
    }
  );

  return edit ? await editScript(props) : await adjustScript(props);
};
