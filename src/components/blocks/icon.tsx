import {
  ArrowDown,
  Baby,
  BookOpen,
  Calendar,
  Car,
  Check,
  CircleCheck,
  CirclePlay,
  Clock,
  Download,
  Ear,
  Eye,
  Files,
  FolderOpen,
  Gift,
  Globe,
  Heart,
  House,
  Infinity as InfinityIcon,
  Link2,
  LockKeyhole,
  LogIn,
  type LucideProps,
  Mail,
  PenLine,
  Printer,
  RefreshCcw,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";

/** Central icon map so content files reference icons by name (kept small; tree-shaken). */
export const icons = {
  arrowDown: ArrowDown,
  baby: Baby,
  book: BookOpen,
  calendar: Calendar,
  car: Car,
  check: CircleCheck,
  child: Smile,
  clock: Clock,
  download: Download,
  ear: Ear,
  eye: Eye,
  files: Files,
  folder: FolderOpen,
  gift: Gift,
  globe: Globe,
  heart: Heart,
  home: House,
  infinity: InfinityIcon,
  link: Link2,
  lock: LockKeyhole,
  login: LogIn,
  mail: Mail,
  pen: PenLine,
  play: CirclePlay,
  printer: Printer,
  refresh: RefreshCcw,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  utensils: Utensils,
  /** Plain check mark for use inside a round marker (BulletList, AssuranceList). */
  tick: Check,
} as const;

export type IconName = keyof typeof icons;

type Props = LucideProps & { name: IconName };

/** Decorative by default (aria-hidden); pass `aria-label` to make it meaningful. */
export function Icon({ name, ...props }: Props) {
  const Component = icons[name];
  return <Component aria-hidden={props["aria-label"] ? undefined : true} focusable="false" {...props} />;
}
