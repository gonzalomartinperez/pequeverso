"use client";

import { createContext, type ReactNode, startTransition, useContext, useMemo, useState } from "react";

type AgeState = {
  /** Index of the selected age option, or null when no selector is mounted. */
  selected: number | null;
  select: (index: number) => void;
};

const AgeContext = createContext<AgeState>({ selected: null, select: () => undefined });

type Props = { initial: number; children: ReactNode };

/** Shares the selected age between the hero radios and the worksheet stack; updates run in a transition. */
export function AgeProvider({ initial, children }: Props) {
  const [selected, setSelected] = useState(initial);
  const value = useMemo<AgeState>(
    () => ({ selected, select: (index) => startTransition(() => setSelected(index)) }),
    [selected],
  );
  return <AgeContext value={value}>{children}</AgeContext>;
}

/** Current age selection (null outside an `AgeProvider`). */
export function useAge(): AgeState {
  return useContext(AgeContext);
}
