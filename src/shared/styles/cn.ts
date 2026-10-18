import { createCn } from "cn/engine";
import tables from "./cn-tables";

/**
 * Tailwind class merge (`clsx` + conflict resolution) over merge tables compiled from this
 * repository's sources by `cn build` (see `withCn` in config/next.ts), so client bundles carry
 * only the class groups the site uses instead of the full ~13 KB runtime.
 */
export const cn = createCn(tables);
