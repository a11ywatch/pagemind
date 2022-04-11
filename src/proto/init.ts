import {
  createClient,
  createMavClient,
  createCdnClient,
} from "./website-client";
import { createServer } from "./website-server";

export const startGRPC = async () => {
  await createServer();
  await createClient();

  // external rpc servers TODO: mock via test
  if (process.env.NODE_ENV !== "test") {
    await createMavClient();
    await createCdnClient();
  }
};
