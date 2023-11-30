import { classNames } from "@calcom/lib";

export function Label(props: JSX.IntrinsicElements["label"]) {
  return (
    <label
      {...props}
      className={classNames("text-default text-default mb-1 block text-xs font-semibold", props.className)}>
      {props.children}
    </label>
  );
}
