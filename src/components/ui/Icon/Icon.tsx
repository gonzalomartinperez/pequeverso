import {
  BookOpen,
  Calendar,
  Car,
  Clock,
  Download,
  Ear,
  Eye,
  Files,
  FolderOpen,
  Globe,
  Heart,
  House,
  Infinity as InfinityIcon,
  Link2,
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
} from "lucide-react";

/** Central icon map so content files reference icons by name (kept small; tree-shaken). */
export const icons = {
  book: BookOpen,
  calendar: Calendar,
  car: Car,
  child: Smile,
  clock: Clock,
  download: Download,
  ear: Ear,
  eye: Eye,
  files: Files,
  folder: FolderOpen,
  globe: Globe,
  heart: Heart,
  home: House,
  infinity: InfinityIcon,
  link: Link2,
  login: LogIn,
  mail: Mail,
  pen: PenLine,
  printer: Printer,
  refresh: RefreshCcw,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
} as const;

export type IconName = keyof typeof icons;

type Props = LucideProps & { name: IconName };

/** Decorative by default (aria-hidden); pass `aria-label` to make it meaningful. */
export function Icon({ name, ...props }: Props) {
  const Component = icons[name];
  return <Component aria-hidden={props["aria-label"] ? undefined : true} focusable="false" {...props} />;
}
