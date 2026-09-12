import { formatUsd, guaranteeDays } from "@config/commerce";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon/Icon";
import styles from "./PriceBlock.module.css";

type Props = {
  kicker: string;
  price: number;
  /** Previous price in the same funnel (only shown when it was actually offered before, e.g. downsell). */
  previous?: { label: string; price: number };
  taxNote: string;
  currencyNote?: string;
  cta: ReactNode;
  ctaNote?: string;
  tone?: "light" | "dark";
  id?: string;
};

/** Price, tax/currency notes, CTA slot and the guarantee line. No invented anchors. */
export function PriceBlock({
  kicker,
  price,
  previous,
  taxNote,
  currencyNote,
  cta,
  ctaNote,
  tone = "light",
  id,
}: Props) {
  return (
    <div className={`${styles.block} ${tone === "dark" ? styles.dark : ""}`} id={id}>
      <p className={styles.kicker}>{kicker}</p>
      <div className={styles.priceRow}>
        <p className={styles.price}>
          <span className="visually-hidden">Precio: </span>
          {formatUsd(price)}
        </p>
        {previous ? (
          <p className={styles.previous}>
            <span className={styles.previousLabel}>{previous.label}</span>
            <s>{formatUsd(previous.price)}</s>
          </p>
        ) : null}
      </div>
      <p className={styles.note}>{taxNote}</p>
      {currencyNote ? <p className={styles.note}>{currencyNote}</p> : null}
      <div className={styles.cta}>{cta}</div>
      {ctaNote ? (
        <p className={styles.guarantee}>
          <Icon name="shield" size={18} />
          <span>{ctaNote}</span>
        </p>
      ) : (
        <p className={styles.guarantee}>
          <Icon name="shield" size={18} />
          <span>Pago único · {guaranteeDays} días de garantía en Hotmart</span>
        </p>
      )}
    </div>
  );
}
