import { createMavClient, createCdnClient } from "./website-client";
import { createServer } from "./grpc-server";

export const startGRPC = async () => {
  await createServer();
  await startClientsGRPC();
};

export const startClientsGRPC = async (retry?: boolean) => {
  return new Promise(async (resolve) => {
    // external rpc servers TODO: mock via test
    if (process.env.NODE_ENV !== "test") {
      setTimeout(async () => {
        try {
          await createMavClient();
          await createCdnClient();
        } catch (e) {
          console.error(e);
          if (!retry) {
            return await startClientsGRPC(true);
          }

          resolve(true);
        }
      }, 60);
    }

    resolve(true);
  });
};
