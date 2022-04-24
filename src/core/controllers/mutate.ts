import { adjustScript, editScript } from "./update";

// edits or add a script source then sends to AWS
export const mutateScript = async (body) => {
  const { editScript: edit, url, userId, script, newScript } = body ?? {};

  try {
    return await (edit ? editScript : adjustScript)(
      Object.assign(
        {},
        {
          url: decodeURIComponent(url + ""),
          userId,
          script,
          newScript,
        }
      )
    );
  } catch (e) {
    console.error(e);
  }
};
