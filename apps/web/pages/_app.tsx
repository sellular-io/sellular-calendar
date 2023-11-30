import { trpc } from "@calcom/trpc/react";
import React, {  useEffect} from "react";
import type { AppProps } from "@lib/app-providers";
import "../styles/globals.css";

function MyApp(props: AppProps) {
  const { Component, pageProps } = props;
  useEffect(()=>{
    const message = {
      source: 'calendar-frame',
      type: 'mounted',

    }
    window.parent.postMessage(message, '*')
  },[])
  if (Component.PageWrapper !== undefined) return Component.PageWrapper(props);
  return <Component {...pageProps} />;
}

export default trpc.withTRPC(MyApp);
