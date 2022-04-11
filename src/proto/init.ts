import { createClient, createMavClient } from "./website-client";
import { createServer } from "./website-server";

export const startGRPC = async () => {
  await createServer();
  await createClient();

  if (process.env.NODE_ENV !== "test") {
    await createMavClient();
  }
};
