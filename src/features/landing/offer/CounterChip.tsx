import { Counter } from "@/motion/counter";

type Props = { value: number; unit: string };

/** Fact chip whose number counts up when it enters the viewport; the server renders the final value. */
export function CounterChip({ value, unit }: Props) {
  return (
    <span className="on-light inline-flex min-h-11 items-baseline gap-2 rounded-md border border-border bg-card px-3 py-2 text-small font-bold text-body shadow-sm">
      <Counter value={value} className="font-display text-h3 leading-none text-navy" />
      <span>{unit}</span>
    </span>
  );
}
