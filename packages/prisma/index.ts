import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import { bookingReferenceMiddleware, credentialEncryptionMiddleware } from "./middleware";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaOptions: Prisma.PrismaClientOptions = {};

if (!!process.env.NEXT_PUBLIC_DEBUG) prismaOptions.log = ["query", "error", "warn"];

export const prisma = globalThis.prisma || new PrismaClient(prismaOptions);

export const customPrisma = (options: Prisma.PrismaClientOptions) =>
  new PrismaClient({ ...prismaOptions, ...options });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!globalThis.registeredMiddlewares) {
    bookingReferenceMiddleware(prisma);
    credentialEncryptionMiddleware(prisma);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.registeredMiddlewares = true;
  }
} else {
  bookingReferenceMiddleware(prisma);
  credentialEncryptionMiddleware(prisma);
}

export default prisma;

export * from "./selects";
