import type { NextApiRequest, NextApiResponse } from "next";
import * as process from "process";
import { v4 } from "uuid";
import { z } from "zod";

import { DEFAULT_SCHEDULE, getAvailabilityFromSchedule } from "@calcom/lib/availability";
import slugify from "@calcom/lib/slugify";
import { closeComUpsertTeamUser } from "@calcom/lib/sync/SyncServiceManager";
import prisma from "@calcom/prisma";
import type { Prisma } from "@calcom/prisma/client";
import { IdentityProvider, WebhookTriggerEvents } from "@calcom/prisma/enums";

import verifyAdminToken from "@lib/auth/verifyAdminToken";

const signupSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  language: z.string().optional(),
  timeZone: z.string().optional(),
});

const WEBHOOK_SUBSCRIBER_URL = process.env.SEL_WEBHOOK_SUBSCRIBER_URL;
const WEBHOOK_SECRET = process.env.SEL_WEBHOOK_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return;
  }

  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  if (process.env.NEXT_PUBLIC_DISABLE_SIGNUP === "true") {
    res.status(403).json({ message: "Signup is disabled" });
    return;
  }

  const data = req.body;
  const { email, language, timeZone = "" } = signupSchema.parse(data);

  const username = slugify(data.username || "");
  const userEmail = email?.toLowerCase() || "";
  const fullName = data.fullname || username;

  if (!username) {
    res.status(422).json({ message: "Invalid username" });
    return;
  }

  // There is an existingUser if the username matches
  // OR if the email matches AND either the email is verified
  // or both username and password are set
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        {
          AND: [
            { email: userEmail },
            {
              OR: [
                { emailVerified: { not: null } },
                {
                  AND: [{ password: { not: null } }, { username: { not: null } }],
                },
              ],
            },
          ],
        },
      ],
    },
  });

  if (existingUser) {
    const message: string =
      existingUser.email !== userEmail ? "Username already taken" : "Email address is already registered";

    // SEL-Change - send the existing user details.
    return res.status(409).json({ message, user: existingUser });
  }

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      username,
      emailVerified: new Date(Date.now()),
      identityProvider: IdentityProvider.CAL,
    },
    create: {
      username,
      email: userEmail,
      name: fullName,
      emailVerified: new Date(Date.now()),
      identityProvider: IdentityProvider.CAL,
      completedOnboarding: true,
      hideBranding: true,
      brandColor: "#5506BE",
      darkBrandColor: "#5506BE",
      timeZone: timeZone,
    },
  });

  // If user has been invitedTo a team, we accept the membership
  if (user.invitedTo) {
    const team = await prisma.team.findFirst({
      where: { id: user.invitedTo },
    });

    if (team) {
      const membership = await prisma.membership.update({
        where: {
          userId_teamId: { userId: user.id, teamId: user.invitedTo },
        },
        data: {
          accepted: true,
        },
      });

      // Sync Services: Close.com
      closeComUpsertTeamUser(team, user, membership.role);
    }
  }

  // SEL-CHANGE - Create a default schedule/availability for the new user
  const scheduleData: Prisma.ScheduleCreateInput = {
    name: "Working hours",
    timeZone,
    user: {
      connect: {
        id: user.id,
      },
    },
  };
  const availability = getAvailabilityFromSchedule(DEFAULT_SCHEDULE);
  scheduleData.availability = {
    createMany: {
      data: availability.map((schedule) => ({
        days: schedule.days,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })),
    },
  };

  const schedule = await prisma.schedule.create({
    data: scheduleData,
  });

  if (!user.defaultScheduleId) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        defaultScheduleId: schedule.id,
      },
    });
  }

  // SEL-CHANGE - Create a default webhook for new user
  await prisma.webhook.create({
    data: {
      id: v4(),
      active: true,
      userId: user.id,
      payloadTemplate: null,
      secret: WEBHOOK_SECRET,
      subscriberUrl: `${WEBHOOK_SUBSCRIBER_URL}v1/calcom/user-webhook`,

      eventTriggers: [
        WebhookTriggerEvents.BOOKING_CANCELLED,
        WebhookTriggerEvents.BOOKING_CREATED,
        WebhookTriggerEvents.BOOKING_REJECTED,
        WebhookTriggerEvents.BOOKING_REQUESTED,
        WebhookTriggerEvents.BOOKING_RESCHEDULED,
        WebhookTriggerEvents.MEETING_ENDED,
        WebhookTriggerEvents.RECORDING_READY,
      ],
    },
  });

  res.status(201).json({ message: "Created user", user });
}
