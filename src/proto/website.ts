import { load } from "@grpc/proto-loader";
import { loadPackageDefinition } from "@grpc/grpc-js";
import type {
  GrpcObject,
  Client,
  ServiceClientConstructor,
  ProtobufTypeDefinition,
} from "@grpc/grpc-js";
import { getNodeModulesPath } from "@a11ywatch/website-source-builder/dist/node-path";

const nodePath = getNodeModulesPath();

type GRPC = GrpcObject | ServiceClientConstructor | ProtobufTypeDefinition;

// the generic unwrapping of the gRPC service
type RpcService = typeof Client & {
  service?: any;
};

export interface Service {
  website?: { WebsiteService?: RpcService };
  Pagemind?: RpcService;
  Cdn?: RpcService;
  Mav?: RpcService;
  health?: {
    HealthCheck?: RpcService;
  };
}

export const getProto = async (
  target: string = "pagemind.proto"
): Promise<Service & GRPC> => {
  try {
    const packageDef = await load(`${nodePath}/@a11ywatch/protos/${target}`, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    return loadPackageDefinition(packageDef);
  } catch (e) {
    console.error(e);
  }
};
