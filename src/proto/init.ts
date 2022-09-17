import { createMavClient, createCdnClient } from "./website-client";
import { createServer } from "./grpc-server";

export const startGRPC = async () =>
  await Promise.all([createServer(), startClientsGRPC()]);

export const startClientsGRPC = async () =>
  await Promise.all([createMavClient(), createCdnClient()]);
