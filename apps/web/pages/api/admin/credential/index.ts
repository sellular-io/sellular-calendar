import { mapValues, toNumber } from "lodash";
import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "@calcom/prisma";
import { userMetadata } from "@calcom/prisma/zod-utils";

import verifyAdminToken from "@lib/auth/verifyAdminToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(422).json({ message: (err as Error).message });
  }

  const { type, key, userId, appId } = req.body;
  const conferenceAppList: string[] = ["zoom_video", "office365_video", "google_video"];
  const conferenceAppSlugMap: { [key: string]: string } = {
    zoom_video: "zoom",
    office365_video: "msteams",
    google_video: "google-meet",
  };
  const googleAppList: string[] = ["google_calendar", "google_video"];
  const zoomAppList: string[] = ["zoom_video"];
  const microsoftAppList: string[] = ["office365_calendar", "office365_video"];
  let customExpiry: number;
  if (req.method === "POST") {
    if (conferenceAppList.includes(type)) {
      const existingConferenceCredential = await prisma.credential.findMany({
        select: {
          id: true,
        },
        where: {
          type: type,
          userId: userId,
          appId: appId,
        },
      });
      // // Making sure we only delete specific app conference credentials
      const credentialIdsToDelete = existingConferenceCredential.map((item) => item.id);
      if (credentialIdsToDelete.length > 0) {
        await prisma.credential.deleteMany({ where: { id: { in: credentialIdsToDelete }, userId } });
      }
    }

    if (microsoftAppList.includes(type)) {
      const whoami = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: "Bearer " + key.access_token },
      });
      const graphUser = await whoami.json();

      // In some cases, graphUser.mail is null. Then graphUser.userPrincipalName most likely contains the email address.
      key.email = graphUser.mail ?? graphUser.userPrincipalName;
      customExpiry = Math.round(+new Date() / 1000 + key.expires_in); // set expiry date in seconds for ms
      key.expiry_date = customExpiry - 120;
      delete key.expires_in;
    }
    if (googleAppList.includes(type)) {
      customExpiry = Math.round(Date.now() + key.expires_in * 1000); // set expiry date in milliseconds
      key.expiry_date = customExpiry - 120000;
      delete key.expires_in;
    }
    if (zoomAppList.includes(type)) {
      customExpiry = Math.round(Date.now() + key.expires_in * 1000); // set expiry date in milliseconds
      key.expiry_date = customExpiry - 120000;
      delete key.expires_in;
    }

    const credential = await prisma.credential.create({
      data: {
        type,
        key,
        userId,
        appId,
      },
    });

    if (conferenceAppList.includes(type)) {
      const existingConferenceCredentials = await prisma.credential.findMany({
        where: {
          userId: userId,
          type: {
            in: conferenceAppList,
          },
          NOT: {
            id: credential.id,
          },
        },
      });
      if (existingConferenceCredentials.length === 0) {
        const userObj = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        });
        let currentMetadata = userMetadata.parse(userObj?.metadata);
        currentMetadata = currentMetadata || {};
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            metadata: {
              ...currentMetadata,
              defaultConferencingApp: {
                appSlug: conferenceAppSlugMap[type],
              },
            },
          },
        });
      }
    }
    return res.status(201).json({ message: "Credential created", data: credential });
  }

  if (req.method === "GET") {
    const credential = await prisma.credential.findMany({
      where: {
        ...mapValues(req.query || {}, (val, key) => {
          if (key === "id" || key === "userId") {
            return toNumber(val);
          }
          return val;
        }),
      },
    });
    return res.status(200).json({ data: credential });
  }

  res.status(405).json({ message: "Method Not Allowed" });
}
