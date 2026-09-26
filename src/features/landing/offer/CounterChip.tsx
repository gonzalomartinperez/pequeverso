import { Counter } from "@/motion/counter";

type Props = { value: number; unit: string };

/**
 * Glass counter tile whose number counts up when it enters the viewport; the server renders the
 * final value (the e2e suite reads it from the HTML).
 */
export function CounterChip({ value, unit }: Props) {
  return (
    <span className="on-light glass inline-grid min-h-11 min-w-22 justify-items-center gap-0.5 rounded-lg px-4 py-3 text-center shadow-[0_12px_32px_-18px_oklch(0.3175_0.1094_256.25/0.45)]">
      <Counter value={value} className="font-display text-[2rem] leading-none font-bold text-navy" />
      <span className="text-tiny font-extrabold tracking-[0.06em] text-subtle uppercase">{unit}</span>
    </span>
  );
}
