"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        onError: (error) => {
          console.error("SWR Error:", error);
        },
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          // Don't retry on 404
          if (error.status === 404) return;
          
          // Don't retry more than 3 times
          if (retryCount >= 3) return;
          
          // Exponential backoff
          setTimeout(() => revalidate({ retryCount }), Math.pow(2, retryCount) * 1000);
        }
      }}
    >
      {children}
    </SWRConfig>
  );
}