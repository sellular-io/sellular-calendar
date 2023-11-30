import { zodResolver } from "@hookform/resolvers/zod";
import { jwtVerify } from "jose";
import { get } from "lodash";
import { useEffect, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { getCsrfToken, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { ErrorCode } from "@calcom/features/auth/lib/ErrorCode";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { isSAMLLoginEnabled, samlProductID, samlTenantID } from "@calcom/features/ee/sso/lib/saml";
import { WEBAPP_URL, WEBSITE_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@calcom/lib/telemetry";
import prisma from "@calcom/prisma";

import type { inferSSRProps } from "@lib/types/inferSSRProps";
import type { WithNonceProps } from "@lib/withNonce";
import withNonce from "@lib/withNonce";

import PageWrapper from "@components/PageWrapper";

import { IS_GOOGLE_LOGIN_ENABLED } from "@server/lib/constants";
import { ssrInit } from "@server/lib/ssr";

interface LoginValues {
  email: string;
  password: string;
  totpCode: string;
  csrfToken: string;
}

export default function Login({ csrfToken }: inferSSRProps<typeof _getServerSideProps> & WithNonceProps) {
  const { t } = useLocale();
  const router = useRouter();
  const formSchema = z
    .object({
      email: z
        .string()
        .min(1, `${t("error_required_field")}`)
        .email(`${t("enter_valid_email")}`),
      password: z.string().min(1, `${t("error_required_field")}`),
    })
    // Passthrough other fields like totpCode
    .passthrough();
  const methods = useForm<LoginValues>({ resolver: zodResolver(formSchema) });
  const { register, formState } = methods;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorMessages: { [key: string]: string } = {
    // [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    // Don't leak information about whether an email is registered or not
    // [ErrorCode.IncorrectUsernamePassword]: t("incorrect_username_password"),
    [ErrorCode.InvalidJwtToken]: `Invalid Plivo JWT token.`,
    [ErrorCode.JwtTokenMissing]: `Plivo JWT token is missing`,
    [ErrorCode.IncorrectTwoFactorCode]: `${t("incorrect_2fa_code")} ${t("please_try_again")}`,
    [ErrorCode.InternalServerError]: `${t("something_went_wrong")} ${t("please_try_again_and_contact_us")}`,
    [ErrorCode.ThirdPartyIdentityProviderEnabled]: t("account_created_with_identity_provider"),
  };

  const telemetry = useTelemetry();

  let callbackUrl = typeof router.query?.callbackUrl === "string" ? router.query.callbackUrl : "";

  if (/"\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);

  const token = router.query.token || "";

  // If not absolute URL, make it absolute
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${WEBAPP_URL}/${callbackUrl}`;
  }

  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl);

  callbackUrl = safeCallbackUrl || "";

  useEffect(() => {
    telemetry.event(telemetryEventTypes.login, collectPageParameters());
    signIn<"credentials">("credentials", {
      token,
      callbackUrl,
      redirect: false,
    }).then((res) => {
      if (!res) setErrorMessage(errorMessages[ErrorCode.InternalServerError]);   
      // we're logged in! let's do a hard refresh to the desired url
      else if (!res.error) router.push(callbackUrl);
      else {
        console.log(res);
        setErrorMessage(errorMessages[get(res, "error", ErrorCode.InternalServerError)]);
      }
    });
  }, [token, callbackUrl, router, setErrorMessage, telemetry, errorMessages]);

  return <div>{errorMessage ? errorMessage : ""}</div>;
}

// TODO: Once we understand how to retrieve prop types automatically from getServerSideProps, remove this temporary variable
const _getServerSideProps = async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, res, query } = context;
  const isSellular = query?.isSellular
  const isSelSettings = query?.isSelSettings
  const sellularEmail = query?.email
  const isSelConfSettings = query?.isSelConfSettings
  const isSellularCalendar = isSellular === "true";
  const isSellularSettings = isSelSettings === "true";
  const isSellularConfSettings = isSelConfSettings === "true";
  let session = await getServerSession({ req, res });
  if(sellularEmail && session?.user?.email !== sellularEmail) {
    session = null
  }
  const ssr = await ssrInit(context);

  const verifyJwt = (jwt: string) => {
    const secret = new TextEncoder().encode(process.env.CALENDSO_ENCRYPTION_KEY);

    return jwtVerify(jwt, secret, {
      issuer: WEBSITE_URL,
      audience: `${WEBSITE_URL}/auth/login`,
      algorithms: ["HS256"],
    });
  };

  let totpEmail = null;
  if (context.query.totp) {
    try {
      const decryptedJwt = await verifyJwt(context.query.totp as string);
      if (decryptedJwt.payload) {
        totpEmail = decryptedJwt.payload.email as string;
      } else {
        return {
          redirect: {
            destination: "/auth/error?error=JWT%20Invalid%20Payload",
            permanent: false,
          },
        };
      }
    } catch (e) {
      return {
        redirect: {
          destination: "/auth/error?error=Invalid%20JWT%3A%20Please%20try%20again",
          permanent: false,
        },
      };
    }
  }

  if (session) {
    return {
      redirect: {
        destination: `/${isSellularCalendar ? `?isSellular=true` : isSellularSettings ? `?isSelSettings=true` : isSellularConfSettings ? `?isSelConfSettings=true` : ""}`,
        permanent: false,
      },
    };
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    // Proceed to new onboarding to create first admin user
    return {
      redirect: {
        destination: "/auth/setup",
        permanent: false,
      },
    };
  }
  return {
    props: {
      csrfToken: await getCsrfToken(context),
      trpcState: ssr.dehydrate(),
      isGoogleLoginEnabled: IS_GOOGLE_LOGIN_ENABLED,
      isSAMLLoginEnabled,
      samlTenantID,
      samlProductID,
      totpEmail,
    },
  };
};

Login.isThemeSupported = false;
Login.PageWrapper = PageWrapper;

export const getServerSideProps = withNonce(_getServerSideProps);
