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

  try {
    if (edit) {
      return await editScript(props);
    } else {
      return await adjustScript(props);
    }
  } catch (e) {
    console.error(e);
  }
};
