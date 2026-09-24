import { Counter } from "@/motion/counter";
import styles from "./CounterChip.module.css";

type Props = { value: number; unit: string };

/** Fact chip whose number counts up when it enters the viewport; the server renders the final value. */
export function CounterChip({ value, unit }: Props) {
  return (
    <span className={styles.chip}>
      <Counter value={value} className={styles.value} />
      <span>{unit}</span>
    </span>
  );
}
