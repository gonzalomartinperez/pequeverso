/**
 * Class join for client islands (strings only, no conflict resolution; 0.2 KB). Client
 * components outside `src/components/ui` use this instead of `cn` so the merge engine only
 * ships on pages that render a shadcn primitive. Server blocks and primitives use `cn`.
 */
export function cx(...inputs: ReadonlyArray<string | false | null | undefined>): string {
  let out = "";
  for (const input of inputs) {
    if (!input) continue;
    out = out ? `${out} ${input}` : input;
  }
  return out;
}
