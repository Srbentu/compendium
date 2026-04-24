declare module "lucide-react" {
  import { ForwardRefExoticComponent, RefAttributes, SVGProps, SVGSVGElement } from "react";

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;

  // All icons used in the project
  export const ArrowLeft: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Check: LucideIcon;
  export const CheckIcon: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronDownIcon: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronRightIcon: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronUpIcon: LucideIcon;
  export const CircleCheckIcon: LucideIcon;
  export const InfoIcon: LucideIcon;
  export const TriangleAlertIcon: LucideIcon;
  export const OctagonXIcon: LucideIcon;
  export const Loader2: LucideIcon;
  export const Loader2Icon: LucideIcon;
  export const LogOut: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Newspaper: LucideIcon;
  export const Pause: LucideIcon;
  export const Play: LucideIcon;
  export const Plus: LucideIcon;
  export const Rss: LucideIcon;
  export const Settings: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Trash2: LucideIcon;
  export const Tv: LucideIcon;
  export const X: LucideIcon;
  export const XIcon: LucideIcon;
}