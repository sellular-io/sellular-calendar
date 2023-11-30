import { mapValues } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "@calcom/prisma";

import verifyAdminToken from "@lib/auth/verifyAdminToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  if (req.method === "GET") {
    const app = await prisma.app.findMany({
      where: {
        ...mapValues(req.query || {}, (val, key) => {
          if (key === "categories") {
            return {
              hasSome: [val],
            };
          }
          return val;
        }),
      },
      select: {
        slug: true,
        dirName: true,
        categories: true,
      },
    });
    return res.status(200).json({ data: app });
  }

  res.status(405).json({ message: "Method Not Allowed" });
}