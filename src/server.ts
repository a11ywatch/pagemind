import { startGRPC } from "./proto/init";
import { getWsEndPoint } from "./config/chrome";

export const coreServer = async () => {
  await startGRPC();
  await getWsEndPoint(true);
};

coreServer();
