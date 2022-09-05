import { createMavClient, createCdnClient } from "./website-client";
import { createServer } from "./grpc-server";

export const startGRPC = async () => {
  return new Promise(async (resolve) => {
    await createServer();
    await startClientsGRPC();
    resolve(true);
  });
};

export const startClientsGRPC = async (retry?: boolean) => {
  return new Promise(async (resolve) => {
    try {
      await createMavClient();
      await createCdnClient();
    } catch (e) {
      console.error(e);
      if (!retry) {
        setTimeout(async () => {
          await startClientsGRPC(true);
          resolve(true);
        }, 11);
      }
    }

    resolve(true);
  });
};
