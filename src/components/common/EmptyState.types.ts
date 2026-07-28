export type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: EmptyStateAction;
  variant?: "compact" | "default" | "error";
};
