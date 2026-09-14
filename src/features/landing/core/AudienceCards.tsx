import { BulletList } from "@/components/ui/BulletList/BulletList";
import { Card } from "@/components/ui/Card/Card";
import { Grid } from "@/components/ui/Grid/Grid";

type AudienceCard = { title: string; items: readonly string[] };

type Props = { yes: AudienceCard; no: AudienceCard };

/** "Es para ti / no es para ti": two honest cards so the visitor can self-qualify before paying. */
export function AudienceCards({ yes, no }: Props) {
  return (
    <Grid cols={2} as="ul">
      <Card as="li" pad="lg" reveal stagger={0}>
        <h3>{yes.title}</h3>
        <BulletList items={yes.items} icon="heart" />
      </Card>
      <Card as="li" variant="soft" pad="lg" reveal stagger={1}>
        <h3>{no.title}</h3>
        <BulletList items={no.items} icon="eye" />
      </Card>
    </Grid>
  );
}
