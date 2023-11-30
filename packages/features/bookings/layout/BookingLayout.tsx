import type { ComponentProps } from "react";
import React from "react";
import { useRouter } from "next/router";

import Shell from "@calcom/features/shell/Shell";
import { HorizontalTabs } from "@calcom/ui";
import type { VerticalTabItemProps, HorizontalTabItemProps } from "@calcom/ui";

import { FiltersContainer } from "../components/FiltersContainer";

const tabs: (VerticalTabItemProps | HorizontalTabItemProps)[] = [
  {
    name: "upcoming",
    href: "/bookings/upcoming",
  },
  {
    name: "unconfirmed",
    href: "/bookings/unconfirmed",
  },
  {
    name: "recurring",
    href: "/bookings/recurring",
  },
  {
    name: "past",
    href: "/bookings/past",
  },
  {
    name: "cancelled",
    href: "/bookings/cancelled",
  },
];

export default function BookingLayout({
  children,
  ...rest
}: { children: React.ReactNode } & ComponentProps<typeof Shell>) {
  const router = useRouter();
  const { isSellular } = router.query;
  const isSellularCalendar = isSellular === "true";
  const updatedTabs  = tabs.map((item)=>{
    return {
      ...item,
      href:`${item.href}${isSellularCalendar? `?isSellular=true` : ''}`
    }
  })
  return (
    <Shell {...rest} hideHeadingOnMobile>
      <div className="flex flex-col m-4">
        <div className="flex flex-col lg:flex-row">
          <HorizontalTabs tabs={updatedTabs} />
          <div className="overflow-x-auto lg:ml-auto">
            <FiltersContainer />
          </div>
        </div>
        <main className="w-full">{children}</main>
      </div>
    </Shell>
  );
}
export const getLayout = (page: React.ReactElement) => <BookingLayout>{page}</BookingLayout>;
