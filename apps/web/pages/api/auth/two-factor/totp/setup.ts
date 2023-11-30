import type { NextApiRequest, NextApiResponse } from "next";
import qrcode from "qrcode";

import { ErrorCode } from "@calcom/features/auth/lib/ErrorCode";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { verifyPassword } from "@calcom/features/auth/lib/verifyPassword";
import { symmetricEncrypt } from "@calcom/lib/crypto";
import prisma from "@calcom/prisma";
import { IdentityProvider } from "@calcom/prisma/enums";
import { authenticator } from 'otplib';

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

  // This generates a secret 32 characters in length. Do not modify the number of
  // bytes without updating the sanity checks in the enable and login endpoints.
  const secret = authenticator.generateSecret(20);

  const name = user.email || user.username || user.id.toString();
  const keyUri = authenticator.keyuri(name, "Cal", secret);
  const dataUri = await qrcode.toDataURL(keyUri);

  return res.json({ secret, keyUri, dataUri });
}
