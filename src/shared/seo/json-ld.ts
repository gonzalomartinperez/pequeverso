/**
 * The only serializer for the JSON-LD script bodies. `JSON.stringify` alone
 * would let a string containing `</script>` close the tag, so every `<` is written as its JSON
 * escape `<`; the output still parses back to the same value (Next.js JSON-LD guide).
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
