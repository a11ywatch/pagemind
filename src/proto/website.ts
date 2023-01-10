import { load } from "@grpc/proto-loader";
import { loadPackageDefinition } from "@grpc/grpc-js";
import type {
  GrpcObject,
  Client,
  ServiceClientConstructor,
  ProtobufTypeDefinition,
} from "@grpc/grpc-js";
import { getNodeModulesPath } from "@a11ywatch/website-source-builder/dist/node-path";

let nodePath = null;

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
  target: string = "pagemind.proto",
  retry?: boolean
): Promise<Service & GRPC> => {
  try {
    const packageDef = await load(
      `${nodePath || "./node_modules"}/@a11ywatch/protos/${target}`,
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      }
    );

    return loadPackageDefinition(packageDef);
  } catch (e) {
    if (!nodePath) {
      nodePath = getNodeModulesPath();
    }
    if (!retry) {
      return await getProto(target, true);
    } else {
      console.error(["Pagemind protoloader failed:", e]);
    }
  }
};
