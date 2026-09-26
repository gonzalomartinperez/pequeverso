import type { ReactNode } from "react";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { MediaImage } from "@/components/blocks/media-image";

type Props = {
  kicker: string;
  /** The `SyllablePlayground` island (it draws its own card). */
  children: ReactNode;
  /** Transparent cut-out shown beside the demo from lg (a parent and child with syllable cards). */
  image?: string | undefined;
};

/**
 * The syllable playground inside the navy method band; from lg a family holding the GA · TO
 * cards stands in a frosted portal beside it, cut by the portal's lower edge.
 */
export function PlaygroundCard({ kicker, children, image }: Props) {
  return (
    <div
      data-slot="playground-card"
      className={
        image
          ? "grid gap-6 @min-[60rem]:grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)] @min-[60rem]:items-stretch"
          : "grid gap-6"
      }
    >
      <div className="grid min-w-0 content-start gap-4" data-reveal="">
        <Eyebrow>{kicker}</Eyebrow>
        {children}
      </div>
      {image ? (
        <div
          aria-hidden="true"
          className="glass-dark relative hidden min-h-96 overflow-hidden rounded-2xl @min-[60rem]:block"
          data-reveal=""
        >
          <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_35%,oklch(0.5324_0.0917_190.84/55%),transparent_72%)]" />
          <div className="absolute inset-x-[4%] bottom-0 [&_img]:h-auto [&_img]:w-full [&_picture]:contents">
            <MediaImage id={image} sizes="360px" alt="" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
