import { Card } from "@/components/ui/Card/Card";
import type { IconName } from "@/components/ui/Icon/Icon";
import { IconBadge } from "@/components/ui/IconBadge/IconBadge";
import { Steps } from "@/components/ui/Steps/Steps";
import { StickyStack } from "@/motion/StickyStack";
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
