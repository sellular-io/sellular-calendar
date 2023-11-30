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
    id: z.string().transform((val) => parseInt(val)),
  });

  const parsedQuery = querySchema.safeParse(req.query);
  const credentialId = parsedQuery.success ? parsedQuery.data.id : null;

  if (!credentialId) {
    return res.status(400).json({ message: "No credential id provided" });
  }

  if (req.method === "GET") {
    const credential = await prisma.credential.findUnique({
      where: {
        id: credentialId,
      },
    });
    return res.status(200).json({ data: credential });
  }

  if (req.method === "PATCH") {
    const credential = await prisma.credential.update({
      where: {
        id: credentialId,
      },
      data: {
        ...pick(req.body, ["key"]),
      },
    });
    return res.status(200).json({ message: "Credential updated", data: credential });
  }

  res.status(405).json({ message: "Method Not Allowed" });
}