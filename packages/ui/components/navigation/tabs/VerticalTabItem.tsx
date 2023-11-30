import Link from "next/link";
import { useRouter } from "next/router";
import type { ComponentProps } from "react";
import { Fragment } from "react";

import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { SVGComponent } from "@calcom/types/SVGComponent";

import { ChevronRight, ExternalLink } from "../../icon";
import { Skeleton } from "../../skeleton";

export type VerticalTabItemProps = {
  name: string;
  info?: string;
  icon?: SVGComponent;
  disabled?: boolean;
  children?: VerticalTabItemProps[];
  textClassNames?: string;
  className?: string;
  isChild?: boolean;
  hidden?: boolean;
  disableChevron?: boolean;
  href: string;
  isExternalLink?: boolean;
  linkProps?: Omit<ComponentProps<typeof Link>, "href">;
  avatar?: string;
  iconClassName?: string;
  hide?:boolean;
};

const VerticalTabItem = ({
  name,
  href,
  info,
  isChild,
  disableChevron,
  linkProps,
  ...props
}: VerticalTabItemProps) => {
  const { t } = useLocale();
  const { asPath } = useRouter();
  const isCurrent = asPath.startsWith(href);
  return (
    <Fragment key={name}>
      {!props.hidden && (
        <>
          <Link
            key={name}
            href={href}
            {...linkProps}
            target={props.isExternalLink ? "_blank" : "_self"}
            className={classNames(
              props.textClassNames || "text-default text-sm font-medium leading-none",
              "text-emphasis min-h-8 hover:bg-subtle [&[aria-current='page']]:bg-active [&[aria-current='page']]:text-sel-main-primary group-hover:text-default group flex w-72 flex-row items-center px-3 py-[10px] p-4",
              props.disabled && "pointer-events-none !opacity-30",
              (isChild || !props.icon) && "ml-7 w-auto ltr:mr-5 rtl:ml-5",
              !info ? "h-6" : "h-auto",
              props.className
            )}
            data-testid={`vertical-tab-${name}`}
            aria-current={isCurrent ? "page" : undefined}>
            {props.icon && (
              <props.icon
                className={classNames(
                  "h-[16px] w-[16px] stroke-[2px] ltr:mr-2 rtl:ml-2 md:mt-0",
                  props.iconClassName
                )}
              />
            )}
            <div className="h-fit">
              <span className="flex items-center space-x-2 rtl:space-x-reverse">
                <Skeleton title={t(name)} as="p" className="max-w-36 min-h-4 mt-px truncate font-semibold">
                  {t(name)}
                </Skeleton>
                {props.isExternalLink ? <ExternalLink /> : null}
              </span>
              {info && (
                <Skeleton as="p" title={t(info)} className="max-w-56 mt-1 truncate font-normal text-default pb-[1px]">
                  {t(info)}
                </Skeleton>
              )}
            </div>
            {!disableChevron && isCurrent && (
              <div className="ml-auto self-center">
                <ChevronRight
                  width={20}
                  height={20}
                  className="text-default h-auto w-[20px] stroke-[1.5px]"
                />
              </div>
            )}
          </Link>
          {props.children?.map((child) => (
            <VerticalTabItem key={child.name} {...child} isChild />
          ))}
        </>
      )}
    </Fragment>
  );
};

export default VerticalTabItem;
