import type { ReactNode } from "react";

export type EmptyStateAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: EmptyStateAction;
  actions?: EmptyStateAction[];
  variant?: "compact" | "default" | "error";
  children?: ReactNode;
  footer?: ReactNode;
};
