declare module "lucide-react" {
  import { ForwardRefExoticComponent, RefAttributes, SVGProps, SVGSVGElement } from "react";

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }

  export type LucideIcon = ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;

  export const BookOpen: LucideIcon;
  export const LogOut: LucideIcon;
  export const Plus: LucideIcon;
  export const Settings: LucideIcon;
  // Add more icons here as needed
}