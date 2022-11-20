import {
  createWebsiteClient,
  createMavClient,
  createCdnClient,
} from "./website-client";
import { createServer } from "./grpc-server";

export const startGRPC = async () =>
  await Promise.all([
    createServer(),
    createWebsiteClient(),
    createMavClient(),
    createCdnClient(),
  ]);
