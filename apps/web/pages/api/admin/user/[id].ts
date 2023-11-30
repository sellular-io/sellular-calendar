import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
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
  const userId = parsedQuery.success ? parsedQuery.data.id : null;

  if (!userId) {
    return res.status(400).json({ message: "No user id provided" });
  }

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return res
      .status(200)
      .json({ data: { ...user, calendar_prefix_domain: process.env.NEXT_PUBLIC_WEBSITE_URL } });
  }

  if (req.method === "PATCH") {
    try {
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...pick(req.body, [
            "username",
            "name",
            "avatar",
            "timeZone",
            "weekStart",
            "hideBranding",
            "theme",
            "completedOnboarding",
            "verified",
            "bio",
          ]),
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          emailVerified: true,
          bio: true,
          avatar: true,
          timeZone: true,
          weekStart: true,
          startTime: true,
          endTime: true,
          bufferTime: true,
          hideBranding: true,
          theme: true,
          createdDate: true,
          completedOnboarding: true,
        },
      });
      return res.status(200).json({
        message: "User Updated",
        data: { ...updatedUser, calendar_prefix_domain: process.env.NEXT_PUBLIC_WEBSITE_URL },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          return res.status(422).json({ message: "Username already taken" });
        }
      }
      throw e;
    }
  }
}
