"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { startSiteAnalytics } from "./entry.ts";

export function SiteAnalyticsMount({ endpoint }: { endpoint: string }) {
  const pathname = usePathname();
  const latest = useRef(pathname),
    runtime = useRef<ReturnType<typeof startSiteAnalytics> | null>(null);
  useEffect(() => {
    let cancelled = false;
    // StrictMode's discarded mount cannot start a request before its cleanup.
    queueMicrotask(() => {
      if (!cancelled) runtime.current = startSiteAnalytics(endpoint, latest.current);
    });
    return () => {
      cancelled = true;
      runtime.current?.stop();
      runtime.current = null;
    };
  }, [endpoint]);
  useEffect(() => {
    latest.current = pathname;
    runtime.current?.navigate(pathname);
  }, [pathname]);
  return null;
}
