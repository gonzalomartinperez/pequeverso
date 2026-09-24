import type { IconName } from "@/components/blocks/icon";
import { IconBadge } from "@/components/blocks/icon-badge";
import { Steps } from "@/components/blocks/steps";
import { Card } from "@/components/ui/card";
import { StickyStack } from "@/motion/sticky-stack";
import styles from "./MethodSteps.module.css";

type Step = { icon: IconName; title: string; text: string };

type Props = { steps: readonly Step[] };

/** Mira · Di · Traza · Une: horizontal steps from md up, a sticky pile of cards below. */
export function MethodSteps({ steps }: Props) {
  return (
    <div className={styles.host}>
      <div className={styles.wide}>
        <Steps steps={steps} tone="dark" />
      </div>
      <div className={styles.narrow}>
        <StickyStack
          items={steps.map((step, index) => (
            <Card key={step.title} variant="navy" pad="lg" as="article" className={styles.card}>
              <IconBadge icon={step.icon} size={72} tone="dark" number={index + 1} />
              <h3 className={styles.title}>{step.title}</h3>
              <p>{step.text}</p>
            </Card>
          ))}
        />
      </div>
    </div>
  );
}
