import type { IconName } from "@/components/blocks/icon";
import { IconBadge } from "@/components/blocks/icon-badge";
import { Steps } from "@/components/blocks/steps";
import { Card } from "@/components/ui/card";
import { StickyStack } from "@/motion/sticky-stack";

type Step = { icon: IconName; title: string; text: string };

type Props = { steps: readonly Step[] };

/** Mira · Di · Traza · Une: horizontal steps from md up, a sticky pile of cards below. */
export function MethodSteps({ steps }: Props) {
  return (
    <div data-slot="method-steps" className="cq">
      <div className="hidden cq-md:block">
        <Steps steps={steps} tone="dark" />
      </div>
      <div className="cq-md:hidden">
        <StickyStack
          items={steps.map((step, index) => (
            <Card
              key={step.title}
              variant="navy"
              pad="lg"
              as="article"
              className="justify-items-start shadow-lg"
            >
              <IconBadge icon={step.icon} size={72} tone="dark" number={index + 1} />
              <h3 className="font-display text-h2 font-bold">{step.title}</h3>
              <p>{step.text}</p>
            </Card>
          ))}
        />
      </div>
    </div>
  );
}
