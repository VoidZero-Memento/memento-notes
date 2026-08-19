import type { ReactNode } from "react";

export type LightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
  children?: ReactNode;
};
