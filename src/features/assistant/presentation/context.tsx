"use client";
import type { AssistantCopy } from "@content/es/assistant";
import { createContext, type ReactNode, useContext } from "react";
import type { LinkPolicy } from "../domain/links";

export type Presentation = {
  t: AssistantCopy;
  policy: LinkPolicy;
  /** Storefront support page, offered when the assistant is unavailable. */
  supportPath: string;
  privacyPath: string;
  /** False while the panel is minimized: no announcements. */
  visible: boolean;
  /** Called before following a storefront link (a modal panel minimizes so the page shows). */
  onNavigate: () => void;
};

const PresentationContext = createContext<Presentation | null>(null);

export function PresentationProvider({ value, children }: { value: Presentation; children: ReactNode }) {
  return <PresentationContext value={value}>{children}</PresentationContext>;
}

export function usePresentation(): Presentation {
  const value = useContext(PresentationContext);
  if (!value) throw new Error("usePresentation must be used inside PresentationProvider");
  return value;
}
