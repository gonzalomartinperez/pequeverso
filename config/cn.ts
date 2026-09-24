/**
 * Class-merge extension for `cn build` (config/next.ts → withCn): the project's named theme
 * sizes (globals.css `@theme inline`) are not Tailwind's t-shirt scale, so without this
 * `text-price` or `text-h3` would be read as colours and dropped next to `text-coral`.
 */
export default {
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h2", "h3", "lead", "base", "small", "tiny", "price"] }],
      shadow: [{ shadow: ["cta", "cta-hover"] }],
      rounded: [{ rounded: ["chip", "pill"] }],
    },
  },
};
