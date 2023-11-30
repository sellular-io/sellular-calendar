import Link from "next/link";
import { Fragment } from "react";
import { useRouter } from "next/router";

import { InstallAppButton } from "@calcom/app-store/components";
import DisconnectIntegration from "@calcom/features/apps/components/DisconnectIntegration";
import { CalendarSwitch } from "@calcom/features/calendars/CalendarSwitch";
import DestinationCalendarSelector from "@calcom/features/calendars/DestinationCalendarSelector";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import {
  Alert,
  Button,
  EmptyScreen,
  List,
  AppSkeletonLoader as SkeletonLoader,
  ShellSubHeading,
} from "@calcom/ui";
import { Calendar, Plus } from "@calcom/ui/components/icon";

import { QueryCell } from "@lib/QueryCell";

import AppListCard from "@components/AppListCard";
import AdditionalCalendarSelector from "@components/apps/AdditionalCalendarSelector";
import SubHeadingTitleWithConnections from "@components/integrations/SubHeadingTitleWithConnections";

type Props = {
  onChanged: () => unknown | Promise<unknown>;
  fromOnboarding?: boolean;
  destinationCalendarId?: string;
};

function CalendarList(props: Props) {
  const { t } = useLocale();
  const query = trpc.viewer.integrations.useQuery({ variant: "calendar", onlyInstalled: false });

  return (
    <QueryCell
      query={query}
      success={({ data }) => (
        <List>
          {data.items.map((item) => (
            <AppListCard
              title={item.name}
              key={item.name}
              logo={item.logo}
              description={item.description}
              shouldHighlight
              slug={item.slug}
              actions={
                <InstallAppButton
                  type={item.type}
                  render={(buttonProps) => (
                    <Button color="secondary" {...buttonProps}>
                      {t("connect")}
                    </Button>
                  )}
                  onChanged={() => props.onChanged()}
                />
              }
            />
          ))}
        </List>
      )}
    />
  );
}

// todo: @hariom extract this into packages/apps-store as "GeneralAppSettings"
function ConnectedCalendarsList(props: Props) {
  const { t } = useLocale();
  const query = trpc.viewer.connectedCalendars.useQuery(undefined, {
    suspense: true,
  });
  const { fromOnboarding } = props;
  const onSuccess = (calendarInfo: any)=>{
    props.onChanged()
    const message = {
      source: 'calendar-settings-frame',
      type: 'calendar-deleted',
      calendarInfo
    }
    window.parent.postMessage(message, '*')
  }
  return (
    <QueryCell
      query={query}
      empty={() => null}
      success={({ data }) => {
        if (!data.connectedCalendars.length) {
          return null;
        }

        return (
          <List>
            {data.connectedCalendars.map((item) => (
              <Fragment key={item.credentialId}>
                {item.calendars ? (
                  <AppListCard
                    shouldHighlight
                    slug={item.integration.slug}
                    title={item.integration.name}
                    logo={item.integration.logo}
                    description={item.primary?.email ?? item.integration.description}
                    actions={
                      <div className="flex w-32 justify-end">
                        <DisconnectIntegration
                          credentialId={item.credentialId}
                          item={item}
                          disableOverlay={true}
                          trashIcon
                          onSuccess={onSuccess}
                          
                        />
                      </div>
                    }>
                    <div className="border-subtle border-t">
                      {!fromOnboarding && (
                        <>
                          <p className="text-emphasis px-4 pt-4 text-sm">{t("toggle_calendars_conflict")}</p>
                          <ul className="space-y-4 pl-2 pr-4 pt-2 pb-4">
                            {item.calendars.map((cal) => (
                              <CalendarSwitch
                                key={cal.externalId}
                                externalId={cal.externalId}
                                title={cal.name || "Nameless calendar"}
                                name={cal.name || "Nameless calendar"}
                                type={item.integration.type}
                                isChecked={cal.isSelected}
                                destination={cal.externalId === props.destinationCalendarId}
                              />
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </AppListCard>
                ) : (
                  <Alert
                    severity="warning"
                    title={t("something_went_wrong")}
                    message={
                      <span>
                        <Link href={"/apps/" + item.integration.slug}>{item.integration.name}</Link>:{" "}
                        {t("calendar_error")}
                      </span>
                    }
                    iconClassName="h-10 w-10 ml-2 mr-1 mt-0.5"
                    actions={
                      <div className="flex w-32 justify-end md:pr-1">
                        <DisconnectIntegration
                          credentialId={item.credentialId}
                          item={item}
                          trashIcon
                          onSuccess={onSuccess}
                          
                        />
                      </div>
                    }
                  />
                )}
              </Fragment>
            ))}
          </List>
        );
      }}
    />
  );
}

export function CalendarListContainer(props: { heading?: boolean; fromOnboarding?: boolean }) {
  const { t } = useLocale();
  const { heading = true, fromOnboarding } = props;
  const router = useRouter();
  const {isSelSettings} = router.query
  const isSellularSettings = isSelSettings === 'true'
  const utils = trpc.useContext();
  const onChanged = () =>
    Promise.allSettled([
      utils.viewer.integrations.invalidate(
        { variant: "calendar", onlyInstalled: true },
        {
          exact: true,
        }
      ),
      utils.viewer.connectedCalendars.invalidate(),
    ]);
  const query = trpc.viewer.connectedCalendars.useQuery();
  const installedCalendars = trpc.viewer.integrations.useQuery({ variant: "calendar", onlyInstalled: true });
  const mutation = trpc.viewer.setDestinationCalendar.useMutation({
    onSuccess: () => {
      utils.viewer.connectedCalendars.invalidate();
    },
  });
  return (
    <QueryCell
      query={query}
      customLoader={<SkeletonLoader />}
      success={({ data }) => {
        return (
          <>
            {!!data.connectedCalendars.length || !!installedCalendars.data?.items.length ? (
              <>
                {heading && (
                  <div className="flex flex-col gap-4 px-4 pb-4">
                    {!isSellularSettings && (
                    <ShellSubHeading
                      title={t("calendar")}
                      subtitle={t("installed_app_calendar_description")}
                      className="mb-0 flex flex-wrap items-center gap-4 sm:flex-nowrap md:mb-3 md:gap-0"
                      actions={
                        <div className="flex flex-col xl:flex-row xl:space-x-5">
                          {!!data.connectedCalendars.length && (
                            <div className="flex items-center">
                              <AdditionalCalendarSelector isLoading={mutation.isLoading} />
                            </div>
                          )}
                        </div>
                      }
                    />
                    )}
                    <div className="flex justify-between">
                      <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-center">
                        <div className="md:w-6/12">
                          <h1 className="text-emphasis text-sm font-semibold">{t("create_events_on")}</h1>
                          <p className="text-default text-sm font-normal mt-1">{t("set_calendar")}</p>
                        </div>
                        <div className="justify-end md:w-6/12">
                          <DestinationCalendarSelector
                            onChange={mutation.mutate}
                            hidePlaceholder
                            isLoading={mutation.isLoading}
                            value={data.destinationCalendar?.externalId}
                          />
                        </div>
                      </div>
                    </div>
                    <ConnectedCalendarsList
                      onChanged={onChanged}
                      fromOnboarding={fromOnboarding}
                      destinationCalendarId={data.destinationCalendar?.externalId}
                    />
                  </div>
                )}
              </>
            ) : fromOnboarding ? (
              <>
                {!!query.data?.connectedCalendars.length && (
                  <ShellSubHeading
                    className="mt-4"
                    title={<SubHeadingTitleWithConnections title={t("connect_additional_calendar")} />}
                  />
                )}
                <CalendarList onChanged={onChanged} />
              </>
            ) : (
              <EmptyScreen
                Icon={Calendar}
                headline={t("no_category_apps", {
                  category: t("calendar").toLowerCase(),
                })}
                description={t(`no_category_apps_description_calendar`)}
                buttonRaw={
                  <Button
                    color="secondary"
                    data-testid="connect-calendar-apps"
                    href="/apps/categories/calendar">
                    {t(`connect_calendar_apps`)}
                  </Button>
                }
              />
            )}
          </>
        );
      }}
    />
  );
}
