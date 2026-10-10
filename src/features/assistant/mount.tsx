"use client";
import { launcherCopy as enLauncher } from "@content/en/assistant";
import { launcherCopy as esLauncher } from "@content/es/assistant";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cx } from "@/lib/cx";
import type { LinkPolicy } from "./domain/links";
import type { Language, Page } from "./domain/models";
import { type PublicPath, publicPath } from "./domain/visitor-context";
import styles from "./presentation/assistant.module.css";

export type RouteContext = { path: string; page: Page };

type Props = {
  apiOrigin: string;
  storefrontOrigin: string;
  linkHosts: readonly string[];
  routes: readonly RouteContext[];
  avatarSrc: string;
  supportPath: string;
  privacyPath: string;
};

const loadPanel = () => import("./presentation/panel");
const Panel = lazy(loadPanel);

function normalize(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

/**
 * Launcher in the root layout (so client navigation keeps the conversation). Nothing talks to
 * the API until the visitor opens the assistant: the panel, controller and session are loaded on
 * first use. Hidden (state kept) on pages outside `routes`: offer, thank-you and legal pages.
 */
export function AssistantMount({
  apiOrigin,
  storefrontOrigin,
  linkHosts,
  routes,
  avatarSrc,
  supportPath,
  privacyPath,
}: Props) {
  const pathname = normalize(usePathname());
  const route = routes.find((candidate) => candidate.path === pathname);
  const [locale, setLocale] = useState<Language>("es");
  const t = locale === "en" ? enLauncher : esLauncher;
  const [used, setUsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  const openedPath = useRef<PublicPath | null>(null);
  const policy = useMemo<LinkPolicy>(() => ({ storefrontOrigin, linkHosts }), [storefrontOrigin, linkHosts]);

  useEffect(() => {
    if (!route) setOpen(false);
  }, [route]);

  // Minimizing returns focus to the launcher (it is rendered again once the panel hides).
  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    launcher.current?.focus();
  }, [open]);

  const onMinimize = useCallback(() => {
    restoreFocus.current = true;
    setOpen(false);
  }, []);
  const onUnread = useCallback(() => setUnread(true), []);

  return (
    <div ref={host} data-assistant-host="">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              ref={launcher}
              type="button"
              hidden={!route || open}
              data-testid="assistant-launcher"
              aria-expanded={open}
              aria-controls={used ? "pv-assistant-panel" : undefined}
              aria-label={unread ? `${t.launcherLabel}. ${t.launcherUnread}` : t.launcherLabel}
              onPointerEnter={() => void loadPanel()}
              onFocus={() => void loadPanel()}
              onClick={() => {
                if (openedPath.current === null) openedPath.current = publicPath(pathname);
                setUsed(true);
                setUnread(false);
                setOpen(true);
              }}
              className={cx(
                buttonVariants({ variant: "secondary", size: "icon" }),
                "shadow-float",
                styles.launcher,
              )}
            />
          }
        >
          <Sparkles aria-hidden="true" focusable="false" className="size-6" />
          {unread && <span aria-hidden="true" className={styles.unread} />}
        </TooltipTrigger>
        <TooltipContent role="tooltip">{t.launcherLabel}</TooltipContent>
      </Tooltip>
      {used && (
        <Suspense fallback={null}>
          <Panel
            openedPath={openedPath.current}
            currentPath={publicPath(pathname)}
            locale={locale}
            onLocaleChange={setLocale}
            open={open && route !== undefined}
            onMinimize={onMinimize}
            page={route?.page ?? null}
            apiOrigin={apiOrigin}
            policy={policy}
            avatarSrc={avatarSrc}
            supportPath={supportPath}
            privacyPath={privacyPath}
            host={host}
            onUnread={onUnread}
          />
        </Suspense>
      )}
    </div>
  );
}
