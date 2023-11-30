import { CSSProperties } from "react";

import EmailCommonDivider from "./EmailCommonDivider";

const EmailScheduledBodyHeaderContent = (props: {
  title: string;
  subtitle?: React.ReactNode;
  headStyles?: CSSProperties;
}) => (
  <EmailCommonDivider headStyles={{ padding: 0, ...props.headStyles }} mutipleRows>
    <tr>
      <td
        align="center"
        style={{
          fontSize: 0,
          padding: "10px 25px",
          paddingTop: 6,
          paddingBottom: 0,
          wordBreak: "break-word",
        }}>
        <div
          style={{
            fontFamily: "Roboto, Helvetica, sans-serif",
            fontSize: "18px",
            fontWeight: "600",
            lineHeight: "20px",
            textAlign: "center",
            color: "#222222",
          }}>
          {props.title}
        </div>
      </td>
    </tr>
    {props.subtitle && (
      <tr>
        <td align="center" style={{ fontSize: 0, padding: "8px 25px", wordBreak: "break-word" }}>
          <div
            style={{
              fontFamily: "Roboto, Helvetica, sans-serif",
              fontSize: "14px",
              fontWeight: "400",
              lineHeight: "18px",
              textAlign: "center",
              color: "#606060",
            }}>
            {props.subtitle}
          </div>
        </td>
      </tr>
    )}
  </EmailCommonDivider>
);

export default EmailScheduledBodyHeaderContent;
