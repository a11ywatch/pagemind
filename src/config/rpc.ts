export const GRPC_PORT = 50052;
export const GRRPC_PORT_MAV = 50053;
export const GRRPC_PORT_CDN = 50054;

export const GRPC_HOST = `0.0.0.0:${GRPC_PORT}`;
export const GRPC_HOST_MAV =
  process.env.GRPC_HOST_MAV || `mav:${GRRPC_PORT_MAV}`;
export const GRPC_HOST_CDN =
  process.env.GRPC_HOST_CDN || `cdn-server:${GRRPC_PORT_CDN}`;
