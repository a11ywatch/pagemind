import { createMavClient, createCdnClient } from "./website-client";
import { createServer } from "./grpc-server";

export const startGRPC = async () => {
  return new Promise(async (resolve) => {
    await Promise.all([createServer(), startClientsGRPC()]);

    resolve(true);
  });
};

export const startClientsGRPC = async () => {
  return new Promise(async (resolve) => {
    await createMavClient();
    await createCdnClient();

    resolve(true);
  });
};
