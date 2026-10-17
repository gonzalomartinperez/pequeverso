# Editable architecture diagrams

`system-light.mmd` and `system-dark.mmd` are editable Mermaid sources for the README context
view. Their committed SVGs contain native text and local styles, with no scripts, foreignObject,
remote fonts, images or runtime dependencies. They are documentation, not application assets.

Solid arrows identify implemented paths or explicit actions. Dashed arrows identify disabled,
optional or infrastructure-owned paths; read their labels. The native assistant remains disabled
in publishable builds. vps-ops owns future deployment, TLS and reverse proxy configuration.

The detailed [architecture](../architecture.md) and README sequence remain authoritative for
code direction and request order. On a narrow display, read the adjacent text or open the full
SVG rather than relying on scaled diagram labels. The diagram supports the store conversion
path: choose a product, visit its own or the producer's landing, then purchase through Hotmart.

Renderer: Mermaid 12.2.0, from the local locked distribution installed with Mermaid CLI 12.0.0;
rendered with its browser bundle in Playwright 1.64.1 / Chromium 156.0.8078.4, with strict
security and HTML labels disabled. No GitHub-native preview or CLI subprocess render is claimed.
Both themes were inspected at original resolution and at 896/390 pixels before acceptance.

Biome continues to parse and lint both SVGs. Its `noImportantStyles` and `noDescendingSpecificity` style heuristics are
waived for these two exact generated files: Mermaid emits intentional CSS cascade precedence,
including the explicit contrast styles reviewed above. The generated selector ordering is retained as reviewed. No source-code rule or complete-file
exclusion is introduced. Preserve the generated asset hashes; inspect regenerated SVGs for
active content and actual contrast, and update their provenance together.
