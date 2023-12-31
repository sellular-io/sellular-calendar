import Link from "next/link";
import { useRouter } from "next/router";
import type { ComponentProps } from "react";

import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { SVGComponent } from "@calcom/types/SVGComponent";

import { Avatar } from "../../avatar";
import { SkeletonText } from "../../skeleton";

export type HorizontalTabItemProps = {
  name: string;
  disabled?: boolean;
  className?: string;
  href: string;
  linkProps?: Omit<ComponentProps<typeof Link>, "href">;
  icon?: SVGComponent;
  avatar?: string;
};

const HorizontalTabItem = function ({ name, href, linkProps, avatar, ...props }: HorizontalTabItemProps) {
  const { t, isLocaleReady } = useLocale();
  const { asPath } = useRouter();

  const isCurrent = asPath === href;

  return (
    <Link
      key={name}
      href={href}
      {...linkProps}
      className={classNames(
        isCurrent ? "bg-info text-sel-main-primary font-semibold" : "hover:bg-subtle hover:text-emphasis text-default font-medium",
        "inline-flex items-center justify-center whitespace-nowrap p-2 text-sm leading-4 md:mb-0",
        props.disabled && "pointer-events-none !opacity-30",
        props.className
      )}
      aria-current={isCurrent ? "page" : undefined}>
      {props.icon && (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        <props.icon
          className={classNames(
            isCurrent ? "text-emphasis" : "group-hover:text-subtle text-muted",
            "-ml-0.5 hidden h-4 w-4 ltr:mr-2 rtl:ml-2 sm:inline-block"
          )}
          aria-hidden="true"
        />
      )}
      {isLocaleReady ? (
        <div className="flex items-center gap-x-2">
          {avatar && <Avatar size="sm" imageSrc={avatar} alt="avatar" />} {t(name)}
        </div>
      ) : (
        <SkeletonText className="h-4 w-24" />
      )}
    </Link>
  );
};

export default HorizontalTabItem;
