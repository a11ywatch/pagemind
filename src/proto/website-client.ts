import { credentials } from "@grpc/grpc-js";
import { GRPC_HOST_CORE, GRPC_HOST_MAV } from "../config/rpc";
import { Service, getProto } from "./website";

let mavClient: Service["Mav"]["service"];
let websiteClient: Service["website"]["WebsiteService"]["service"];

export const killClient = () => {
  mavClient?.close();
};

// core service server client
const createWebsiteClient = async () => {
  const { website } = await getProto("website.proto");
  websiteClient = new website.WebsiteService(
    GRPC_HOST_CORE,
    credentials.createInsecure()
  );
};

// mav service server client for testing
const createMavClient = async () => {
  const { Mav } = await getProto("mav.proto");
  mavClient = new Mav(GRPC_HOST_MAV, credentials.createInsecure());
};

const parseImg = (
  website = {}
): Promise<{
  className: string;
  probability: number;
}> => {
  return new Promise((resolve, reject) => {
    mavClient.parseImg(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

// store lighthouse results
const addLighthouse = (website = {}) => {
  return new Promise((resolve, reject) => {
    websiteClient.pageSet(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

export const controller = {
  parseImg,
  addLighthouse,
};

export { mavClient, websiteClient, createMavClient, createWebsiteClient };
