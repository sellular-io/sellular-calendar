import { verify } from "jsonwebtoken";
import { NextApiRequest } from "next";

import { ErrorCode } from "@calcom/features/auth/lib/ErrorCode";

export default async (req: NextApiRequest): Promise<boolean> => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error(ErrorCode.JwtTokenMissing);
  }
  const payload: { plivo_admin?: boolean | string } = await new Promise((resolve, reject) => {
    verify(token, process.env.NEXTAUTH_SECRET as string, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as { plivo_admin?: boolean });
      }
    });
  });

  return payload.plivo_admin == true;
};