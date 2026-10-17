"use client";
import { useState } from "react";
import { createStoreAssistant } from "./entry";
import { AssistantPanel, type PanelProps } from "./presentation/panel";

type Props = Omit<PanelProps, "assistant"> & { apiOrigin: string };

/** Lazy composition boundary: the view receives a stable controller, never an HTTP factory. */
export function AssistantRuntime({ apiOrigin, ...props }: Props) {
  const [assistant] = useState(() => createStoreAssistant(apiOrigin, props.policy));
  return <AssistantPanel {...props} assistant={assistant} />;
}
