import type { GetServerSidePropsContext } from "next";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

function RedirectPage() {
  return;
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerSession({ req, res });
  const headers = req.headers;
  const refererHeader = headers["referer"];
  let isSellularFromHeader = false;
  let isSellularSettingsFromHeader = false;
  let isSellularConfSettingsFromHeader = false;
  if (refererHeader) {
    const url = new URL(refererHeader);
    isSellularFromHeader = Boolean(url.searchParams.get("isSellular"));
    isSellularSettingsFromHeader = Boolean(url.searchParams.get("isSelSettings"));
    isSellularConfSettingsFromHeader = Boolean(url.searchParams.get("isSelConfSettings"));
  }
  const urlString = req.url;
  const queryString = urlString?.split("?")[1] || "";
  const queryParams = new URLSearchParams(queryString);
  const isSellular = queryParams?.get("isSellular") || false;
  const isSellularSettings = queryParams?.get("isSelSettings") || false;
  const isSellularConfSettings = queryParams?.get("isSelConfSettings") || false;

  if (!session?.user?.id) {
    return { redirect: { permanent: false, destination: "/auth/login" } };
  } else if (isSellularSettings || isSellularSettingsFromHeader) {
    return {
      redirect: {
        permanent: false,
        destination: `/apps/installed/calendar?isSelSettings=true`,
      },
    };
  } else if (isSellularConfSettings || isSellularConfSettingsFromHeader) {
    return {
      redirect: {
        permanent: false,
        destination: `/apps/installed/conferencing?isSelConfSettings=true`,
      },
    };
  }
  return {
    redirect: {
      permanent: false,
      destination: `/event-types${
        isSellular || isSellularFromHeader ? `?isSellular=true` : ""
      }`,
    },
  };
}

export default RedirectPage;
