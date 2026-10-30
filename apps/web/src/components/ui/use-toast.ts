import * as React from "react";

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, ...props, createdAt: new Date() };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const dismiss = (id?: string) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  };

  return { toast, dismiss, toasts };
}

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  createdAt: Date;
};

export type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};