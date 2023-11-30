import { mapValues, pick, toNumber } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 } from "uuid";

import prisma from "@calcom/prisma";

import verifyAdminToken from "@lib/auth/verifyAdminToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  if (req.method === "POST") {
    const webhook = await prisma.webhook.create({
      data: { id: v4(), ...pick(req.body, ["userId", "eventTriggers", "subscriberUrl", "secret", "active"]) },
    });
    return res.status(201).json({ message: "Webhook created", data: webhook });
  }

  if (req.method === "GET") {
    const webhook = await prisma.webhook.findMany({
      where: {
        ...mapValues(req.query || {}, (val, key) => {
          if (key === "userId") {
            return toNumber(val);
          }
          return val;
        }),
      },
    });
    return res.status(200).json({ data: webhook });
  }

  res.status(405).json({ message: "Method Not Allowed" });
}