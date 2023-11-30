import { pick } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";
import z from "zod";

import prisma from "@calcom/prisma";

import verifyAdminToken from "@lib/auth/verifyAdminToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  const querySchema = z.object({
    id: z.string(),
  });

  const parsedQuery = querySchema.safeParse(req.query);
  const webhookId = parsedQuery.success ? parsedQuery.data.id : null;

  if (!webhookId) {
    return res.status(400).json({ message: "No webhook id provided" });
  }

  if (req.method === "GET") {
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: webhookId,
      },
    });
    return res.status(200).json({ data: webhook });
  }

  if (req.method === "PATCH") {
    const webhook = await prisma.webhook.update({
      where: {
        id: webhookId,
      },
      data: {
        ...pick(req.body, ["eventTriggers", "subscriberUrl", "secret", "active"]),
      },
    });
    return res.status(200).json({ message: "Webhook updated", data: webhook });
  }

  res.status(405).json({ message: "Method Not Allowed" });
}