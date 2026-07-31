export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  type: ToastType;
  content: string;
  duration: number;
};

export type ToastListener = (items: ToastItem[]) => void;
