import { toNumber } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "@calcom/prisma";

import verifyAdminToken from "@lib/auth/verifyAdminToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  if (!req.query.userId) {
    return res.status(400).json({ message: "No user id provided" });
  }

  if (req.method === "DELETE") {
    await prisma.session.deleteMany({
      where: {
        userId: toNumber(req.query.userId),
      },
    });
    return res.status(200).json({ message: "Sessions deleted" });
  }

  res.status(405).json({ message: "Method Not Allowed" });
}