import type { PrismaClient } from "@prisma/client";
import Cryptr from "cryptr";
import stringify from "fast-safe-stringify";
import { get, isArray } from "lodash";

async function middleware(prisma: PrismaClient) {
  if (!process.env.NEXT_ENCRYPTION_KEY) {
    throw new Error("NEXT_ENCRYPTION_KEY is not set");
  }

  const cryptr = new Cryptr(process.env.NEXT_ENCRYPTION_KEY);

  prisma.$use(async (params, next) => {
    if (params.model === "Credential") {
      if (params.action === "upsert") {
        params.args["create"] = {
          ...params.args.create,
          ...(get(params, "args.create.key")
            ? { key: { encrypted: cryptr.encrypt(stringify(params.args.create.key)) } }
            : {}),
        };
        params.args["update"] = {
          ...params.args.update,
          ...(get(params, "args.update.key")
            ? { key: { encrypted: cryptr.encrypt(stringify(params.args.update.key)) } }
            : {}),
        };
      }

      if (params.action === "create" || params.action === "update") {
        params.args["data"] = {
          ...params.args.data,
          ...(get(params, "args.data.key")
            ? { key: { encrypted: cryptr.encrypt(stringify(params.args.data.key)) } }
            : {}),
        };
      }

      const result = await next(params);

      if (isArray(result)) {
        return result.map((item) => ({
          ...item,
          ...(get(item, "key.encrypted") ? { key: JSON.parse(cryptr.decrypt(item.key.encrypted)) } : {}),
        }));
      }
      return {
        ...result,
        ...(get(result, "key.encrypted") ? { key: JSON.parse(cryptr.decrypt(result.key.encrypted)) } : {}),
      };
    }

    if (params.model === "App") {
      if (params.action === "upsert") {
        params.args["create"] = {
          ...params.args.create,
          ...(get(params, "args.create.keys")
            ? { keys: { encrypted: cryptr.encrypt(stringify(params.args.create.keys)) } }
            : {}),
        };
        params.args["update"] = {
          ...params.args.update,
          ...(get(params, "args.update.keys")
            ? { keys: { encrypted: cryptr.encrypt(stringify(params.args.update.keys)) } }
            : {}),
        };
      }

      if (params.action === "create" || params.action === "update") {
        params.args["data"] = {
          ...params.args.data,
          ...(get(params, "args.data.keys")
            ? { keys: { encrypted: cryptr.encrypt(stringify(params.args.data.keys)) } }
            : {}),
        };
      }

      const result = await next(params);

      if (isArray(result)) {
        return result.map((item) => ({
          ...item,
          ...(get(item, "keys.encrypted") ? { keys: JSON.parse(cryptr.decrypt(item.keys.encrypted)) } : {}),
        }));
      }
      return {
        ...result,
        ...(get(result, "keys.encrypted") ? { keys: JSON.parse(cryptr.decrypt(result.keys.encrypted)) } : {}),
      };
    }

    if (params.model === "Webhook") {
        if (params.action === "upsert") {
          params.args["create"] = {
            ...params.args.create,
            ...(get(params, "args.create.secret") ? { secret: cryptr.encrypt(params.args.create.secret) } : {}),
          };
          params.args["update"] = {
            ...params.args.update,
            ...(get(params, "args.update.secret") ? { secret: cryptr.encrypt(params.args.update.secret) } : {}),
          };
        }
  
        if (params.action === "create" || params.action === "update") {
          params.args["data"] = {
            ...params.args.data,
            ...(get(params, "args.data.secret") ? { secret: cryptr.encrypt(params.args.data.secret) } : {}),
          };
        }
  
        const result = await next(params);
  
        if (isArray(result)) {
          return result.map((item) => ({
            ...item,
            ...(get(item, "secret") ? { secret: cryptr.decrypt(item.secret) } : {}),
          }));
        }
  
        return {
          ...result,
          ...(get(result, "secret") ? { secret: cryptr.decrypt(result.secret) } : {}),
        };
      }

    return next(params);
  });
}

export default middleware;