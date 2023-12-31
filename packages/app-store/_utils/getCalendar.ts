import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";
import type { Calendar } from "@calcom/types/Calendar";
import type { CredentialPayload } from "@calcom/types/Credential";

import appStore from "..";

const log = logger.getChildLogger({ prefix: ["CalendarManager"] });

export const getCalendar = async (credential: CredentialPayload | null): Promise<Calendar | null> => {
  if (!credential || !credential.key) return null;
  if (credential.key.encrypted) {
    credential = await prisma.credential.findUnique({
      where: {
        id: credential.id,
      },
    });
  }
  let { type: calendarType } = credential;
  if (calendarType?.endsWith("_other_calendar")) {
    calendarType = calendarType.split("_other_calendar")[0];
  }
  const calendarAppImportFn = appStore[calendarType.split("_").join("") as keyof typeof appStore];

  if (!calendarAppImportFn) {
    log.warn(`calendar of type ${calendarType} is not implemented`);
    return null;
  }

  const calendarApp = await calendarAppImportFn();
  if (!(calendarApp && "lib" in calendarApp && "CalendarService" in calendarApp.lib)) {
    log.warn(`calendar of type ${calendarType} is not implemented`);
    return null;
  }
  log.info("calendarApp", calendarApp.lib.CalendarService);
  console.log("##### look here for calendarApp");
  console.log(calendarApp.lib.CalendarService);
  const CalendarService = calendarApp.lib.CalendarService;
  return new CalendarService(credential);
};
