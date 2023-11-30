import type { NextApiRequest, NextApiResponse } from "next";

import { ErrorCode } from "@calcom/features/auth/lib/ErrorCode";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { verifyPassword } from "@calcom/features/auth/lib/verifyPassword";
import { symmetricDecrypt } from "@calcom/lib/crypto";
import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession({ req, res });
  if (!session) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!session.user?.id) {
    console.error("Session is missing a user id.");
    return res.status(500).json({ error: ErrorCode.InternalServerError });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    console.error(`Session references user that no longer exists.`);
    return res.status(401).json({ message: "Not authenticated" });
  }

  // If it is, disable users 2fa
  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  return res.json({ message: "Two factor disabled" });
}
