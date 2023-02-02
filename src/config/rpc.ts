export const GRPC_PORT = 50052;
export const GRRPC_PORT_MAV = 50053;
export const GRPC_PORT_WEBSITE = 50051; // core central

export const GRPC_HOST = `0.0.0.0:${GRPC_PORT}`;

export const GRPC_HOST_MAV =
  process.env.GRPC_HOST_MAV || `127.0.0.1:${GRRPC_PORT_MAV}`;

export const GRPC_HOST_CORE =
  process.env.GRPC_HOST_CORE || `127.0.0.1:${GRPC_PORT_WEBSITE}`;
